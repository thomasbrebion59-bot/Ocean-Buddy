import Foundation
import Security
import Capacitor

/// Compte Ocean Buddy (version 1.5.0) : les jetons de session vivent dans le Trousseau iOS, nulle part ailleurs
/// (ni localStorage, ni Préférences, ni journaux).
/// - Accessibles après le premier déverrouillage, sur CET iPhone seulement : jamais synchronisés avec iCloud
///   ni restaurés sur un autre appareil (kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly).
/// - Le Trousseau survit à la désinstallation, pas les préférences de l'app : au premier lancement d'une
///   nouvelle installation (repère absent), les anciens jetons sont effacés.
/// - Aucun appel réseau ici. La simple présence de ce plugin active le compte dans le code web
///   (mobile/client.js : OceanMobile.capabilities.account) ; les apps 1.4.x, sans lui, ne le montrent pas.
@objc(OceanAccountPlugin)
public class OceanAccountPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OceanAccountPlugin"
    public let jsName = "OceanAccount"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getTokens", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setTokens", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearTokens", returnType: CAPPluginReturnPromise)
    ]

    private static let installMarker = "ob.account.keychain.v1"
    private static let maxTokenBytes = 8192
    private let service = (Bundle.main.bundleIdentifier ?? "oceanbuddy") + ".account"
    private let queue = DispatchQueue(label: "oceanbuddy.account.keychain")

    override public func load() {
        queue.sync {
            let defaults = UserDefaults.standard
            guard !defaults.bool(forKey: Self.installMarker) else { return }
            // Nouvelle installation (ou première version avec compte) : aucun jeton d'une installation précédente.
            if self.deleteAll() { defaults.set(true, forKey: Self.installMarker) }
        }
    }

    @objc func getTokens(_ call: CAPPluginCall) {
        queue.async {
            if let access = self.read("access"), let refresh = self.read("refresh") {
                call.resolve(["access": access, "refresh": refresh])
            } else {
                call.resolve([:])
            }
        }
    }

    @objc func setTokens(_ call: CAPPluginCall) {
        guard let access = call.getString("access"), let refresh = call.getString("refresh"),
              Self.isToken(access), Self.isToken(refresh) else {
            call.reject("invalid_tokens")
            return
        }
        queue.async {
            if self.write("access", access) && self.write("refresh", refresh) {
                call.resolve()
            } else {
                _ = self.deleteAll()
                call.reject("keychain_unavailable")
            }
        }
    }

    @objc func clearTokens(_ call: CAPPluginCall) {
        queue.async {
            if self.deleteAll() { call.resolve() } else { call.reject("keychain_unavailable") }
        }
    }

    /// Jeton JWT ou jeton de rafraîchissement : texte ASCII sans espace, borné.
    private static func isToken(_ value: String) -> Bool {
        !value.isEmpty && value.utf8.count <= maxTokenBytes && value.unicodeScalars.allSatisfy { $0.value > 32 && $0.value < 127 }
    }

    private func query(_ account: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: account]
    }

    private func read(_ account: String) -> String? {
        var q = query(account)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func write(_ account: String, _ value: String) -> Bool {
        SecItemDelete(query(account) as CFDictionary)
        var q = query(account)
        q[kSecValueData as String] = Data(value.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }

    private func deleteAll() -> Bool {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service]
        let status = SecItemDelete(q as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}
