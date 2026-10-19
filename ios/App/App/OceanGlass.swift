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
    private let bar = UIVisualEffectView(effect: UIGlassEffect(style: .regular))
    private let lens = UIView()
    private let stack = UIStackView()
    private let poulpy = UIVisualEffectView(effect: {
        let e = UIGlassEffect(style: .regular)
        e.isInteractive = true
        return e
    }())
    private let poulpyImage = UIImageView()
    private let poulpyDot = UIView()
    private var buttons: [GlassTabButton] = []
    private var items: [GlassItem] = []
    private var selected = ""
    private var shown = false
    private var barRect = CGRect.zero
    private var poulpyRect = CGRect.zero
    private var accent = UIColor(red: 31 / 255, green: 85 / 255, blue: 224 / 255, alpha: 1)
    private var keyboardUp = false
    private var last: GlassState?
    private var poulpyWanted = false
    private let haptic = UISelectionFeedbackGenerator()

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
        bar.contentView.addSubview(lens)
        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.alignment = .fill
        bar.contentView.addSubview(stack)

        poulpy.cornerConfiguration = .capsule()
        poulpy.isAccessibilityElement = true
        poulpy.accessibilityTraits = .button
        container.contentView.addSubview(poulpy)
        poulpyImage.contentMode = .scaleAspectFill
        poulpyImage.clipsToBounds = true
        poulpyImage.layer.borderColor = UIColor.white.cgColor
        poulpyImage.layer.borderWidth = 2
        poulpyImage.image = GlassTabOverlay.webImage("assets/poulpy/scenes/travel-v2.webp")
        poulpy.contentView.addSubview(poulpyImage)
        poulpyDot.backgroundColor = UIColor(red: 0.18, green: 0.82, blue: 0.48, alpha: 1)
        poulpyDot.layer.borderColor = UIColor.white.cgColor
        poulpyDot.layer.borderWidth = 2
        poulpy.contentView.addSubview(poulpyDot)
        poulpy.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(poulpyTap)))

        bar.alpha = 0
        poulpy.alpha = 0
        NotificationCenter.default.addObserver(self, selector: #selector(keyboard(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboard(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard shown, !keyboardUp else { return nil }
        if bar.alpha > 0.5, bar.frame.contains(point) { return super.hitTest(point, with: event) }
        if poulpy.alpha > 0.5, poulpy.frame.contains(point) { return super.hitTest(point, with: event) }
        return nil
    }

    func apply(_ s: GlassState) {
        last = s
        if let a = s.accent { accent = a.withAlphaComponent(1) }
        if s.items.map(\.id) != items.map(\.id) { rebuild(s.items) } else if s.items != items { refresh(s.items) }
        let visible = s.visible && !keyboardUp
        if visible && !s.bar.isEmpty {
            let wasShown = shown
            let resized = !wasShown || s.bar != barRect || (s.poulpyVisible && s.poulpyRect != poulpyRect)
            if resized {
                barRect = s.bar
                UIView.performWithoutAnimation {
                    bar.transform = .identity
                    poulpy.transform = .identity
                    bar.frame = s.bar
                    stack.frame = bar.bounds.insetBy(dx: 4, dy: 4)
                    if s.poulpyVisible && !s.poulpyRect.isEmpty {
                        poulpyRect = s.poulpyRect
                        poulpy.frame = s.poulpyRect
                        let d = min(s.poulpyRect.width, s.poulpyRect.height) - 12
                        poulpyImage.frame = CGRect(x: (s.poulpyRect.width - d) / 2, y: (s.poulpyRect.height - d) / 2, width: d, height: d)
                        poulpyImage.layer.cornerRadius = d / 2
                        poulpyDot.frame = CGRect(x: s.poulpyRect.width - 17, y: 6, width: 11, height: 11)
                        poulpyDot.layer.cornerRadius = 5.5
                    }
                    bar.transform = tucked ? GlassTabOverlay.tuckTransform : .identity
                    poulpy.transform = bar.transform
                }
            }
            poulpy.accessibilityLabel = s.poulpyLabel
            select(s.selected, animated: wasShown)
            if resized { UIView.performWithoutAnimation { layoutLens(animated: false) } }
            setTucked(s.tucked)
            poulpyWanted = s.poulpyVisible
            fade(bar: 1, poulpy: poulpyWanted ? 1 : 0)
            shown = true
        } else {
            select(s.selected, animated: false)
            fade(bar: 0, poulpy: 0)
            /* Clavier ouvert : l’état demandé reste en mémoire et revient à la fermeture. */
            if !keyboardUp || !s.visible { shown = false }
        }
    }

    /// Page rechargée : tout est masqué et oublié jusqu’au prochain état.
    func reset() {
        last = nil
        shown = false
        barRect = .zero
        poulpyRect = .zero
        bar.alpha = 0
        poulpy.alpha = 0
    }

    private func rebuild(_ list: [GlassItem]) {
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
        for b in buttons { b.setSelected(b.item.id == id, accent: accent) }
        lens.backgroundColor = accent.withAlphaComponent(0.12)
        if changed { layoutLens(animated: animated) }
    }

    private func layoutLens(animated: Bool) {
        guard let b = buttons.first(where: { $0.item.id == selected }) else { lens.alpha = 0; return }
        stack.layoutIfNeeded()
        let f = b.convert(b.bounds, to: bar.contentView)
        let apply = {
            self.lens.frame = f
            self.lens.layer.cornerRadius = f.height / 2
            self.lens.alpha = 1
        }
        if animated {
            UIView.animate(withDuration: 0.42, delay: 0, usingSpringWithDamping: 0.78, initialSpringVelocity: 0.4, options: [.allowUserInteraction, .beginFromCurrentState], animations: apply)
        } else {
            apply()
        }
    }

    private var tucked = false
    static let tuckTransform = CGAffineTransform(translationX: 0, y: 8).scaledBy(x: 0.94, y: 0.94)
    private func setTucked(_ on: Bool) {
        guard on != tucked else { return }
        tucked = on
        let t: CGAffineTransform = on ? GlassTabOverlay.tuckTransform : .identity
        UIView.animate(withDuration: 0.35, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            self.bar.transform = t
            self.poulpy.transform = t
        }
    }

    private func fade(bar a: CGFloat, poulpy p: CGFloat) {
        guard bar.alpha != a || poulpy.alpha != p else { return }
        UIView.animate(withDuration: 0.2, delay: 0, options: [.allowUserInteraction, .beginFromCurrentState]) {
            self.bar.alpha = a
            self.poulpy.alpha = p
        }
    }

    @objc private func tap(_ sender: GlassTabButton) {
        haptic.selectionChanged()
        select(sender.item.id, animated: true)
        onTab?(sender.item.id)
    }

    @objc private func poulpyTap() {
        haptic.selectionChanged()
        onPoulpy?()
    }

    @objc private func keyboard(_ n: Notification) {
        keyboardUp = n.name == UIResponder.keyboardWillShowNotification
        if keyboardUp { fade(bar: 0, poulpy: 0) } else if let s = last { apply(s) }
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

    func setSelected(_ on: Bool, accent: UIColor) {
        icon.image = UIImage(systemName: on ? item.symbolOn : item.symbol)
        let c: UIColor = on ? accent : .label
        icon.tintColor = c
        label.textColor = c
        accessibilityTraits = on ? [.button, .selected] : .button
    }

    override var isHighlighted: Bool {
        didSet {
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
