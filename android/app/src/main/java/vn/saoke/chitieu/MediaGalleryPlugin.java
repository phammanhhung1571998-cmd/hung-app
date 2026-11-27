package vn.saoke.chitieu;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;

@CapacitorPlugin(
    name = "MediaGallery",
    permissions = {
        @Permission(
            alias = "mediaImages",
            strings = { Manifest.permission.READ_MEDIA_IMAGES }
        ),
        @Permission(
            alias = "storageRead",
            strings = { Manifest.permission.READ_EXTERNAL_STORAGE }
        ),
        @Permission(
            alias = "storageLegacy",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class MediaGalleryPlugin extends Plugin {

    private String getRequiredPermissionAlias() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return "mediaImages";
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return "storageRead";
        } else {
            return "storageLegacy";
        }
    }

    @PluginMethod
    public void saveToGallery(PluginCall call) {
        String alias = getRequiredPermissionAlias();
        if (getPermissionState(alias) != PermissionState.GRANTED) {
            requestPermissionForAlias(alias, call, "galleryPermissionCallback");
            return;
        }
        performSave(call);
    }

    @PermissionCallback
    private void galleryPermissionCallback(PluginCall call) {
        String alias = getRequiredPermissionAlias();
        if (getPermissionState(alias) == PermissionState.GRANTED) {
            performSave(call);
        } else {
            call.reject("Bạn cần cấp quyền truy cập Thư viện ảnh để lưu hình sao kê.");
        }
    }

    private void performSave(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename", "sao-ke.png");

        if (base64 == null || base64.isEmpty()) {
            call.reject("Thiếu dữ liệu hình ảnh.");
            return;
        }

        if (base64.contains(",")) {
            base64 = base64.substring(base64.indexOf(",") + 1);
        }

        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/SaoKeChiTieu");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);
            }

            Uri imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (imageUri == null) {
                call.reject("Không thể tạo tệp ảnh trong Thư viện.");
                return;
            }

            try (OutputStream out = resolver.openOutputStream(imageUri)) {
                if (out == null) {
                    call.reject("Không thể ghi dữ liệu ảnh.");
                    return;
                }
                out.write(bytes);
                out.flush();
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear();
                values.put(MediaStore.Images.Media.IS_PENDING, 0);
                resolver.update(imageUri, values, null, null);
            }

            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("uri", imageUri.toString());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Lỗi khi lưu ảnh vào Thư viện: " + e.getMessage());
        }
    }
}
