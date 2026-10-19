import UIKit
import Capacitor

/// Verre natif iOS 26 (Liquid Glass) : la barre d’onglets et le bouton Poulpy sont de vraies vues
/// UIGlassEffect posées au-dessus de la page web, à l’endroit exact de la barre web (native-glass.js
/// envoie sa position, ses onglets et la sélection). Les touchers reviennent à la page par des
/// événements. Avant iOS 26, available() répond non et la barre CSS reste affichée.
@objc(OceanGlassPlugin)
public class OceanGlassPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OceanGlassPlugin"
    public let jsName = "OceanGlass"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    private var overlay: AnyObject?
    private var loading: NSKeyValueObservation?

    /// Rechargement de la page (mise à jour OTA, retour arrière, plantage du moteur web) : la barre
    /// native disparaît jusqu’au prochain état envoyé par la nouvelle page.
    override public func load() {
        loading = bridge?.webView?.observe(\.isLoading, options: [.new]) { [weak self] webView, _ in
            guard webView.isLoading else { return }
            DispatchQueue.main.async {
                if #available(iOS 26.0, *) { (self?.overlay as? GlassTabOverlay)?.reset() }
            }
        }
    }

    @objc func available(_ call: CAPPluginCall) {
        if #available(iOS 26.0, *) {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else { call.resolve(); return }
        let state = GlassState(call)
        DispatchQueue.main.async { [weak self] in
            guard let self, let host = self.bridge?.viewController?.view else { call.resolve(); return }
            let bar: GlassTabOverlay
            if let existing = self.overlay as? GlassTabOverlay {
                bar = existing
            } else {
                bar = GlassTabOverlay(frame: host.bounds)
                bar.onTab = { [weak self] id in self?.notifyListeners("tab", data: ["id": id]) }
                bar.onPoulpy = { [weak self] in self?.notifyListeners("poulpy", data: [:]) }
                host.addSubview(bar)
                self.overlay = bar
            }
            bar.frame = host.bounds
            bar.apply(state)
            call.resolve()
        }
    }
}

struct GlassItem: Equatable {
    let id: String, label: String, a11y: String, symbol: String, symbolOn: String, badge: String
}

struct GlassState {
    var visible = false
    var bar = CGRect.zero
    var items: [GlassItem] = []
    var selected = ""
    var poulpyVisible = false
    var poulpyRect = CGRect.zero
    var poulpyLabel = ""
    var tucked = false
    var accent: UIColor?

    init(_ call: CAPPluginCall) {
        visible = call.getBool("visible") ?? false
        bar = GlassState.rect(call.getObject("bar"))
        items = (call.getArray("items", JSObject.self) ?? []).compactMap { o in
            guard let id = o["id"] as? String else { return nil }
            return GlassItem(id: id, label: o["label"] as? String ?? id, a11y: o["a11y"] as? String ?? "",
                             symbol: o["symbol"] as? String ?? "circle", symbolOn: o["symbolOn"] as? String ?? "circle.fill",
                             badge: o["badge"] as? String ?? "")
        }
        selected = call.getString("selected") ?? ""
        if let p = call.getObject("poulpy") {
            poulpyVisible = p["visible"] as? Bool ?? false
            poulpyRect = GlassState.rect(p["rect"] as? JSObject)
            poulpyLabel = p["a11y"] as? String ?? ""
        }
        tucked = call.getBool("tucked") ?? false
        accent = GlassState.color(call.getArray("accent"))
    }

    static func rect(_ o: JSObject?) -> CGRect {
        guard let o else { return .zero }
        func n(_ k: String) -> CGFloat { CGFloat((o[k] as? NSNumber)?.doubleValue ?? 0) }
        return CGRect(x: n("x"), y: n("y"), width: n("w"), height: n("h"))
    }

    static func color(_ a: JSArray?) -> UIColor? {
        guard let a, a.count >= 3 else { return nil }
        let v = a.map { CGFloat(($0 as? NSNumber)?.doubleValue ?? 0) }
        return UIColor(red: v[0] / 255, green: v[1] / 255, blue: v[2] / 255, alpha: a.count > 3 ? v[3] : 1)
    }
}

/// Vue plein écran qui laisse passer les touchers partout sauf sur le verre.
@available(iOS 26.0, *)
final class GlassTabOverlay: UIView {
    var onTab: ((String) -> Void)?
    var onPoulpy: (() -> Void)?

    private let container = UIVisualEffectView(effect: {
        let e = UIGlassContainerEffect()
        e.spacing = 14
        return e
    }())
    /* Le verre se matérialise (effet nil → verre) au lieu d’un simple fondu d’opacité. */
    private let barGlass = UIGlassEffect(style: .regular)
    private let poulpyGlass: UIGlassEffect = {
        let e = UIGlassEffect(style: .regular)
        e.isInteractive = true
        return e
    }()
    private let bar = UIVisualEffectView(effect: nil)
    private let lens = UIView()
    private let stack = UIStackView()
    private let poulpy = UIVisualEffectView(effect: nil)
    private let poulpyFace = UIView()
    private let poulpyImage = UIImageView()
    private let poulpyDot = UIView()
    private var buttons: [GlassTabButton] = []
    private var items: [GlassItem] = []
    private var selected = ""
    private var shown = false
    private var barOn = false
    private var poulpyOn = false
    private var barRect = CGRect.zero
    private var poulpyRect = CGRect.zero
    private var accent = UIColor(red: 7 / 255, green: 68 / 255, blue: 89 / 255, alpha: 1)
    private var keyboardUp = false
    private var last: GlassState?
    private var poulpyWanted = false
    private lazy var haptic = UISelectionFeedbackGenerator(view: self)
    private lazy var impact = UIImpactFeedbackGenerator(style: .light, view: poulpy)
    private var reduceMotion = UIAccessibility.isReduceMotionEnabled

    /* Glisser le doigt sur la barre : la lentille se soulève et suit le doigt. */
    private let scrub = UILongPressGestureRecognizer()
    private var scrubbing = false
    /// Cadre reçu pendant un glissement : appliqué au relâcher, sans interrompre le doigt.
    private var pendingFrames = false
    private var scrubIndex = -1
    private var lensGen = 0
    private static let lift: CGFloat = 1.12

    override init(frame: CGRect) {
        super.init(frame: frame)
        autoresizingMask = [.flexibleWidth, .flexibleHeight]
        backgroundColor = .clear
        container.frame = bounds
        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(container)

        bar.cornerConfiguration = .capsule()
        bar.clipsToBounds = false
        container.contentView.addSubview(bar)
        lens.isUserInteractionEnabled = false
        lens.layer.cornerCurve = .continuous
        lens.alpha = 0
        bar.contentView.addSubview(lens)
        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.alignment = .fill
        bar.contentView.addSubview(stack)

        scrub.addTarget(self, action: #selector(scrubbed(_:)))
        scrub.minimumPressDuration = 0.12
        scrub.allowableMovement = .greatestFiniteMagnitude
        bar.addGestureRecognizer(scrub)

        poulpy.cornerConfiguration = .capsule()
        poulpy.isAccessibilityElement = true
        poulpy.accessibilityTraits = .button
        container.contentView.addSubview(poulpy)
        poulpyFace.isUserInteractionEnabled = false
        poulpy.contentView.addSubview(poulpyFace)
        poulpyImage.contentMode = .scaleAspectFill
        poulpyImage.clipsToBounds = true
        poulpyImage.layer.borderColor = UIColor.white.cgColor
        poulpyImage.layer.borderWidth = 2
        poulpyImage.image = GlassTabOverlay.webImage("assets/poulpy/scenes/travel-v2.webp")
        poulpyFace.addSubview(poulpyImage)
        poulpyDot.backgroundColor = UIColor(red: 0.18, green: 0.82, blue: 0.48, alpha: 1)
        poulpyDot.layer.borderColor = UIColor.white.cgColor
        poulpyDot.layer.borderWidth = 2
        poulpyFace.addSubview(poulpyDot)
        poulpy.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(poulpyTap)))

        bar.contentView.alpha = 0
        poulpy.contentView.alpha = 0
        exposeAccessibility(bar: false, poulpy: false)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboard(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboard(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(motionChanged), name: UIAccessibility.reduceMotionStatusDidChangeNotification, object: nil)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard shown, !keyboardUp else { return nil }
        if barOn, bar.frame.contains(point) { return super.hitTest(point, with: event) }
        if poulpyOn, poulpy.frame.contains(point) { return super.hitTest(point, with: event) }
        return nil
    }

    func apply(_ s: GlassState) {
        last = s
        if let a = s.accent { accent = a.withAlphaComponent(1) }
        if s.items.map(\.id) != items.map(\.id) { rebuild(s.items) } else if s.items != items { refresh(s.items) }
        let visible = s.visible && !keyboardUp
        if visible && !s.bar.isEmpty {
            let wasShown = shown
            /* Écart d’au plus 1 pt (arrondis après la rentrée, défilement) : ce n’est pas un redimensionnement. */
            let moved = !GlassTabOverlay.near(s.bar, barRect) || (s.poulpyVisible && !GlassTabOverlay.near(s.poulpyRect, poulpyRect))
            var resized = !wasShown || moved
            if resized && scrubbing && wasShown {
                /* Doigt posé : le nouveau cadre attend le relâcher (endScrub), le glissement continue. */
                pendingFrames = true
                resized = false
            }
            if resized { placeFrames(s) }
            poulpy.accessibilityLabel = s.poulpyLabel
            select(s.selected, animated: wasShown)
            if resized { UIView.performWithoutAnimation { layoutLens(animated: false) } }
            setTucked(s.tucked)
            poulpyWanted = s.poulpyVisible
            show(bar: true, poulpy: poulpyWanted)
            shown = true
        } else {
            if scrubbing { cancelScrub() }
            select(s.selected, animated: false)
            show(bar: false, poulpy: false)
            /* Clavier ouvert : l’état demandé reste en mémoire et revient à la fermeture. */
            if !keyboardUp || !s.visible { shown = false }
        }
    }

    static func near(_ a: CGRect, _ b: CGRect) -> Bool {
        abs(a.minX - b.minX) <= 1 && abs(a.minY - b.minY) <= 1 && abs(a.width - b.width) <= 1 && abs(a.height - b.height) <= 1
    }

    /// Pose les cadres de la barre et de Poulpy (sans animation), puis remet la transformation de rentrée.
    private func placeFrames(_ s: GlassState) {
        barRect = s.bar
        UIView.performWithoutAnimation {
            bar.transform = .identity
            poulpy.transform = .identity
            bar.frame = s.bar
            stack.frame = bar.bounds.insetBy(dx: 4, dy: 4)
            if s.poulpyVisible && !s.poulpyRect.isEmpty {
                poulpyRect = s.poulpyRect
                poulpy.frame = s.poulpyRect
                poulpyFace.transform = .identity
                poulpyFace.frame = poulpy.bounds
                let d = min(s.poulpyRect.width, s.poulpyRect.height) - 12
                poulpyImage.frame = CGRect(x: (s.poulpyRect.width - d) / 2, y: (s.poulpyRect.height - d) / 2, width: d, height: d)
                poulpyImage.layer.cornerRadius = d / 2
                poulpyDot.frame = CGRect(x: s.poulpyRect.width - 17, y: 6, width: 11, height: 11)
                poulpyDot.layer.cornerRadius = 5.5
            }
            bar.transform = tucked ? GlassTabOverlay.tuckTransform : .identity
            poulpy.transform = tucked ? poulpyTuckTransform() : .identity
        }
    }

    /// VoiceOver ne voit que le verre visible (l’effet nil laisse la vue à alpha 1).
    private func exposeAccessibility(bar b: Bool, poulpy p: Bool) {
        poulpy.isAccessibilityElement = p
        poulpy.accessibilityElementsHidden = !p
        bar.accessibilityElementsHidden = !b
    }

    /// Page rechargée : tout est masqué et oublié jusqu’au prochain état.
    func reset() {
        if scrubbing { cancelScrub() }
        pendingFrames = false
        last = nil
        shown = false
        barRect = .zero
        poulpyRect = .zero
        barOn = false
        poulpyOn = false
        tucked = false
        exposeAccessibility(bar: false, poulpy: false)
        UIView.performWithoutAnimation {
            bar.transform = .identity
            poulpy.transform = .identity
            poulpyFace.transform = .identity
            bar.effect = nil
            bar.contentView.alpha = 0
            poulpy.effect = nil
            poulpy.contentView.alpha = 0
        }
        UIAccessibility.post(notification: .layoutChanged, argument: nil)
    }

    private func rebuild(_ list: [GlassItem]) {
        if scrubbing { cancelScrub() }
        items = list
        buttons.forEach { $0.removeFromSuperview() }
        buttons = list.map { item in
            let b = GlassTabButton(item: item)
            b.addTarget(self, action: #selector(tap(_:)), for: .touchUpInside)
            stack.addArrangedSubview(b)
            return b
        }
        selected = ""
    }

    /// Mêmes onglets : libellés et pastilles mis à jour sur place (pas de toucher interrompu).
    private func refresh(_ list: [GlassItem]) {
        items = list
        for (b, item) in zip(buttons, list) { b.update(item) }
    }

    private func select(_ id: String, animated: Bool) {
        let changed = id != selected
        selected = id
        for b in buttons { b.setSelected(b.item.id == id, accent: accent, animated: animated && shown, reduceMotion: reduceMotion) }
        if !scrubbing { lens.backgroundColor = accent.withAlphaComponent(0.12) }
        /* Pendant un glissement, la lentille appartient au doigt ; elle rejoint l’onglet au relâcher. */
        if changed && !scrubbing { layoutLens(animated: animated) }
    }

    /// Cadre d’un onglet dans la barre, sans tenir compte de sa transformation « appuyé ».
    private func slot(_ b: GlassTabButton) -> CGRect {
        let c = stack.convert(b.center, to: bar.contentView)
        let s = b.bounds.size
        return CGRect(x: c.x - s.width / 2, y: c.y - s.height / 2, width: s.width, height: s.height)
    }

    private func layoutLens(animated: Bool) {
        guard let b = buttons.first(where: { $0.item.id == selected }) else { lens.alpha = 0; return }
        stack.layoutIfNeeded()
        moveLens(to: slot(b), animated: animated)
    }

    /// Ressort réel ; la lentille s’étire dans le sens du trajet, proportionnellement à la distance, puis se pose.
    private func moveLens(to f: CGRect, animated: Bool) {
        lensGen += 1
        let gen = lensGen
        let place = {
            self.lens.bounds = CGRect(origin: .zero, size: f.size)
            self.lens.center = CGPoint(x: f.midX, y: f.midY)
            self.lens.layer.cornerRadius = f.height / 2
        }
        guard animated, lens.alpha > 0, lens.bounds.width > 0, window != nil else {
            UIView.performWithoutAnimation {
                lens.transform = .identity
                place()
                lens.alpha = 1
            }
            return
        }
        if reduceMotion {
            /* Réduire les animations : la lentille s’efface puis réapparaît sur l’onglet, sans trajet. */
            UIView.animate(withDuration: 0.12, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
                self.lens.alpha = 0
            } completion: { _ in
                guard gen == self.lensGen else { return }
                UIView.performWithoutAnimation {
                    self.lens.transform = .identity
                    place()
                }
                UIView.animate(withDuration: 0.16, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
                    self.lens.alpha = 1
                }
            }
            return
        }
        lens.alpha = 1
        let travel = abs(f.midX - lens.center.x)
        let stretch = min(0.45, travel / max(f.width, 1) * 0.16)
        UIView.animate(springDuration: 0.5, bounce: 0.28, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState], animations: place)
        guard stretch > 0.01 else {
            UIView.animate(springDuration: 0.4, bounce: 0.3, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
                self.lens.transform = .identity
            }
            return
        }
        UIView.animate(withDuration: 0.14, delay: 0, options: [.curveEaseOut, .allowUserInteraction, .beginFromCurrentState]) {
            self.lens.transform = CGAffineTransform(scaleX: 1 + stretch, y: 1 - stretch * 0.25)
        } completion: { _ in
            guard gen == self.lensGen else { return }
            UIView.animate(springDuration: 0.45, bounce: 0.42, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
                self.lens.transform = .identity
            }
        }
    }

    // MARK: Glisser pour choisir un onglet (comme les barres d’iOS 26)

    private func index(at x: CGFloat) -> Int {
        var best = -1, dist = CGFloat.greatestFiniteMagnitude
        for (i, b) in buttons.enumerated() {
            let d = abs(slot(b).midX - x)
            if d < dist { dist = d; best = i }
        }
        return best
    }

    private func lensX(_ x: CGFloat) -> CGFloat {
        guard let a = buttons.first, let z = buttons.last else { return x }
        return min(max(x, slot(a).midX), slot(z).midX)
    }

    @objc private func scrubbed(_ g: UILongPressGestureRecognizer) {
        let p = g.location(in: bar.contentView)
        switch g.state {
        case .began:
            /* Barre cachée (ne devrait pas recevoir de toucher) : le geste s’efface. */
            guard shown, barOn, !keyboardUp, !buttons.isEmpty else {
                g.isEnabled = false
                g.isEnabled = true
                return
            }
            stack.layoutIfNeeded()
            scrubbing = true
            lensGen += 1
            scrubIndex = index(at: p.x)
            /* Aucun onglet actif : la lentille naît sous le doigt pour que l’appui long reste un choix. */
            if lens.alpha == 0 || lens.bounds.width == 0, buttons.indices.contains(scrubIndex) {
                let f = slot(buttons[scrubIndex])
                UIView.performWithoutAnimation {
                    lens.transform = .identity
                    lens.bounds = CGRect(origin: .zero, size: f.size)
                    lens.center = CGPoint(x: f.midX, y: f.midY)
                    lens.layer.cornerRadius = f.height / 2
                    lens.alpha = 1
                }
            }
            haptic.prepare()
            let x = lensX(p.x)
            let lifted: CGAffineTransform = reduceMotion ? .identity : CGAffineTransform(scaleX: GlassTabOverlay.lift, y: GlassTabOverlay.lift)
            let up = {
                self.lens.center.x = x
                self.lens.transform = lifted
                self.lens.backgroundColor = self.accent.withAlphaComponent(0.2)
            }
            if reduceMotion {
                UIView.animate(withDuration: 0.15, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState], animations: up)
            } else {
                UIView.animate(springDuration: 0.35, bounce: 0.3, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState], animations: up)
            }
        case .changed:
            guard scrubbing else { return }
            /* Doigt parti loin au-dessus ou au-dessous de la barre : on annule, rien n’est choisi. */
            let off = max(0, -p.y, p.y - bar.bounds.height)
            if off > max(56, bar.bounds.height) { cancelScrub(); return }
            let x = lensX(p.x)
            UIView.animate(withDuration: 0.1, delay: 0, options: [.curveEaseOut, .allowUserInteraction, .beginFromCurrentState]) {
                self.lens.center.x = x
            }
            let i = index(at: p.x)
            if i != scrubIndex, i >= 0 {
                scrubIndex = i
                haptic.selectionChanged(at: g.location(in: self))
                haptic.prepare()
            }
        case .ended:
            endScrub(commit: true)
        default:
            endScrub(commit: false)
        }
    }

    private func cancelScrub() {
        endScrub(commit: false)
        /* Rebascule le geste : son état passe à « annulé », le rappel suivant est ignoré. */
        scrub.isEnabled = false
        scrub.isEnabled = true
    }

    private func endScrub(commit: Bool) {
        guard scrubbing else { return }
        let target = commit && buttons.indices.contains(scrubIndex) ? buttons[scrubIndex] : nil
        scrubIndex = -1
        if let b = target {
            /* Encore « en glissement » : select() ne déplace pas la lentille, un seul trajet ci-dessous. */
            select(b.item.id, animated: true)
            b.bounce(reduceMotion: reduceMotion)
        }
        scrubbing = false
        /* Cadre arrivé pendant le glissement : posé maintenant, avant le trajet final de la lentille. */
        if pendingFrames {
            pendingFrames = false
            if shown, let s = last, s.visible, !s.bar.isEmpty { placeFrames(s) }
        }
        lens.backgroundColor = accent.withAlphaComponent(0.12)
        /* Que l’onglet ait changé ou non, la lentille redescend sur l’onglet choisi. */
        layoutLens(animated: true)
        if let b = target { onTab?(b.item.id) }
    }

    // MARK: Rentrée au défilement, apparition, Poulpy

    private var tucked = false
    static let tuckTransform = CGAffineTransform(translationX: 0, y: 8).scaledBy(x: 0.94, y: 0.94)

    /// Rentrée : Poulpy glisse vers la barre jusqu’à toucher son verre, le conteneur fond les deux formes.
    private func poulpyTuckTransform() -> CGAffineTransform {
        let t = GlassTabOverlay.tuckTransform
        guard !reduceMotion, !barRect.isEmpty, !poulpyRect.isEmpty else { return t }
        /* Le rétrécissement de 6 % éloigne chaque bord de 3 % de la largeur. */
        let shrink = (barRect.width + poulpyRect.width) * 0.03
        var dx: CGFloat = 0
        if poulpyRect.minX >= barRect.maxX - 1 {
            let gap = poulpyRect.minX - barRect.maxX
            if gap < 64 { dx = -(gap + shrink + 2) }
        } else if poulpyRect.maxX <= barRect.minX + 1 {
            let gap = barRect.minX - poulpyRect.maxX
            if gap < 64 { dx = gap + shrink + 2 }
        }
        return t.concatenating(CGAffineTransform(translationX: dx, y: 0))
    }

    private func setTucked(_ on: Bool) {
        guard on != tucked else { return }
        tucked = on
        let b: CGAffineTransform = on ? GlassTabOverlay.tuckTransform : .identity
        let p: CGAffineTransform = on ? poulpyTuckTransform() : .identity
        let move = {
            self.bar.transform = b
            self.poulpy.transform = p
        }
        if reduceMotion {
            UIView.animate(withDuration: 0.35, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState], animations: move)
        } else {
            UIView.animate(springDuration: 0.5, bounce: 0.22, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState], animations: move)
        }
    }

    /// Matérialise ou dématérialise le verre (effet animé entre nil et UIGlassEffect).
    private func show(bar b: Bool, poulpy p: Bool) {
        guard b != barOn || p != poulpyOn else { return }
        let barChanged = b != barOn, poulpyChanged = p != poulpyOn
        barOn = b
        poulpyOn = p
        /* Accessibilité basculée tout de suite, hors du bloc animé. */
        exposeAccessibility(bar: b, poulpy: p)
        UIAccessibility.post(notification: .layoutChanged, argument: nil)
        let d = reduceMotion ? 0.2 : 0.32
        UIView.animate(withDuration: d, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            if barChanged {
                self.bar.effect = b ? self.barGlass : nil
                self.bar.contentView.alpha = b ? 1 : 0
            }
            if poulpyChanged {
                self.poulpy.effect = p ? self.poulpyGlass : nil
                self.poulpy.contentView.alpha = p ? 1 : 0
            }
        }
    }

    @objc private func tap(_ sender: GlassTabButton) {
        haptic.selectionChanged(at: sender.convert(CGPoint(x: sender.bounds.midX, y: sender.bounds.midY), to: self))
        select(sender.item.id, animated: true)
        sender.bounce(reduceMotion: reduceMotion)
        onTab?(sender.item.id)
    }

    @objc private func poulpyTap() {
        impact.impactOccurred()
        if !reduceMotion {
            UIView.performWithoutAnimation { poulpyFace.transform = CGAffineTransform(scaleX: 0.86, y: 0.86) }
            UIView.animate(springDuration: 0.35, bounce: 0.5, initialSpringVelocity: 0, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
                self.poulpyFace.transform = .identity
            }
        }
        onPoulpy?()
    }

    @objc private func keyboard(_ n: Notification) {
        keyboardUp = n.name == UIResponder.keyboardWillShowNotification
        if keyboardUp {
            if scrubbing { cancelScrub() }
            show(bar: false, poulpy: false)
        } else if let s = last { apply(s) }
    }

    @objc private func motionChanged() {
        reduceMotion = UIAccessibility.isReduceMotionEnabled
        guard tucked else { return }
        UIView.animate(withDuration: 0.2, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            self.poulpy.transform = self.poulpyTuckTransform()
        }
    }

    /// Image de la page web embarquée (dossier public de l’app).
    static func webImage(_ path: String) -> UIImage? {
        guard let url = Bundle.main.url(forResource: "public/" + path, withExtension: nil) else { return nil }
        return UIImage(contentsOfFile: url.path)
    }
}

/// Onglet : SF Symbol (contour, plein si actif) et libellé, comme la barre web.
@available(iOS 26.0, *)
final class GlassTabButton: UIControl {
    private(set) var item: GlassItem
    private let icon = UIImageView()
    private let label = UILabel()
    private let badge = UILabel()
    private var shownSymbol: String?
    private var shownColor: UIColor?

    init(item: GlassItem) {
        self.item = item
        super.init(frame: .zero)
        icon.contentMode = .scaleAspectFit
        icon.preferredSymbolConfiguration = UIImage.SymbolConfiguration(pointSize: 19, weight: .medium)
        label.text = item.label
        label.font = UIFontMetrics(forTextStyle: .caption2).scaledFont(for: .systemFont(ofSize: 10.5, weight: .semibold), maximumPointSize: 13)
        label.adjustsFontForContentSizeCategory = true
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.8
        label.textAlignment = .center
        label.lineBreakMode = .byTruncatingTail
        badge.text = item.badge
        badge.isHidden = item.badge.isEmpty
        badge.font = .systemFont(ofSize: 10, weight: .heavy)
        badge.textColor = .white
        badge.textAlignment = .center
        badge.backgroundColor = UIColor(red: 1, green: 0.416, blue: 0.302, alpha: 1)
        badge.layer.cornerRadius = 8
        badge.layer.masksToBounds = true
        [icon, label, badge].forEach { $0.isUserInteractionEnabled = false; addSubview($0) }
        isAccessibilityElement = true
        accessibilityLabel = item.a11y.isEmpty ? item.label : item.a11y
        accessibilityTraits = .button
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func layoutSubviews() {
        super.layoutSubviews()
        let w = bounds.width, h = bounds.height
        let labelH = ceil(label.font.lineHeight)
        let iconS: CGFloat = 26
        let top = max(2, (h - iconS - 2 - labelH) / 2)
        icon.frame = CGRect(x: (w - iconS) / 2, y: top, width: iconS, height: iconS)
        label.frame = CGRect(x: 2, y: top + iconS + 2, width: w - 4, height: labelH)
        let bw = max(16, badge.intrinsicContentSize.width + 8)
        badge.frame = CGRect(x: w / 2 + 6, y: max(0, top - 3), width: bw, height: 16)
    }

    func update(_ next: GlassItem) {
        item = next
        label.text = next.label
        badge.text = next.badge
        badge.isHidden = next.badge.isEmpty
        accessibilityLabel = next.a11y.isEmpty ? next.label : next.a11y
        setNeedsLayout()
    }

    /// Contour → plein par une transition de symbole (Magic Replace), couleur animée.
    func setSelected(_ on: Bool, accent: UIColor, animated: Bool, reduceMotion: Bool) {
        let name = on ? item.symbolOn : item.symbol
        let c: UIColor = on ? accent : .label
        accessibilityTraits = on ? [.button, .selected] : .button
        let symbolChanged = name != shownSymbol
        let colorChanged = !(shownColor?.isEqual(c) ?? false)
        guard symbolChanged || colorChanged else { return }
        shownSymbol = name
        shownColor = c
        let image = UIImage(systemName: name)
        guard animated, window != nil else {
            icon.image = image
            icon.tintColor = c
            label.textColor = c
            return
        }
        if symbolChanged, !reduceMotion, let image {
            icon.tintColor = c
            icon.setSymbolImage(image, contentTransition: ReplaceSymbolEffect.replace.magic(fallback: .replace.downUp.byLayer))
        } else {
            UIView.transition(with: icon, duration: 0.22, options: [.transitionCrossDissolve, .allowUserInteraction]) {
                self.icon.image = image
                self.icon.tintColor = c
            }
        }
        UIView.transition(with: label, duration: 0.22, options: [.transitionCrossDissolve, .allowUserInteraction]) {
            self.label.textColor = c
        }
    }

    /// Petit rebond unique du symbole au toucher.
    func bounce(reduceMotion: Bool) {
        guard !reduceMotion else { return }
        icon.addSymbolEffect(.bounce, options: .nonRepeating)
    }

    override var isHighlighted: Bool {
        didSet {
            guard isHighlighted != oldValue else { return }
            UIView.animate(withDuration: 0.25, delay: 0, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.5, options: [.allowUserInteraction, .beginFromCurrentState]) {
                self.transform = self.isHighlighted ? CGAffineTransform(scaleX: 0.92, y: 0.92) : .identity
            }
        }
    }
}

/// Contrôleur racine : celui de Capacitor, avec le plugin local enregistré.
class OceanBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(OceanGlassPlugin())
    }
}
