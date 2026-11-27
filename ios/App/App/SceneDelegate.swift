import UIKit
import Photos
import Capacitor

@objc(MediaGalleryPlugin)
public class MediaGalleryPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MediaGalleryPlugin"
    public let jsName = "MediaGallery"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveToGallery", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveToGallery(_ call: CAPPluginCall) {
        guard var base64 = call.getString("base64"), !base64.isEmpty else {
            call.reject("Thiếu dữ liệu hình ảnh.")
            return
        }

        if let commaIndex = base64.firstIndex(of: ",") {
            base64 = String(base64[base64.index(after: commaIndex)...])
        }

        guard let data = Data(base64Encoded: base64, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data) else {
            call.reject("Dữ liệu ảnh không hợp lệ.")
            return
        }

        let saveImageBlock: (PHAuthorizationStatus) -> Void = { status in
            if status == .authorized || status == .limited {
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAsset(from: image)
                }) { success, error in
                    if success {
                        call.resolve(["saved": true])
                    } else {
                        call.reject("Không thể lưu ảnh vào Thư viện: \(error?.localizedDescription ?? "Lỗi không xác định")")
                    }
                }
            } else {
                call.reject("Bạn cần cấp quyền truy cập Thư viện ảnh để lưu hình sao kê.")
            }
        }

        if #available(iOS 14, *) {
            let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
            if status == .notDetermined {
                PHPhotoLibrary.requestAuthorization(for: .addOnly, handler: saveImageBlock)
            } else {
                saveImageBlock(status)
            }
        } else {
            let status = PHPhotoLibrary.authorizationStatus()
            if status == .notDetermined {
                PHPhotoLibrary.requestAuthorization(saveImageBlock)
            } else {
                saveImageBlock(status)
            }
        }
    }
}

class AppBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MediaGalleryPlugin())
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
