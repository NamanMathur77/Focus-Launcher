package com.focuslauncher.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.util.List;

@CapacitorPlugin(name = "AppLauncherCustom")
public class AppLauncherPlugin extends Plugin {

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();

            Intent intent = new Intent(Intent.ACTION_MAIN, null);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> apps = pm.queryIntentActivities(intent, 0);

            JSArray appList = new JSArray();

            for (ResolveInfo app : apps) {
                JSObject obj = new JSObject();
                obj.put("appName", app.loadLabel(pm).toString());
                obj.put("packageName", app.activityInfo.packageName);
                appList.put(obj);
            }

            JSObject result = new JSObject();
            result.put("apps", appList);

            call.resolve(result);

        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null) {
            call.reject("Package name missing");
            return;
        }

        Intent intent = getContext()
                .getPackageManager()
                .getLaunchIntentForPackage(packageName);

        if (intent == null) {
            call.reject("App not found");
            return;
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

        @PluginMethod
        public void openLauncherChooser(PluginCall call) {
            try {
                // Open the Home (default launcher) settings screen so the user can
                // choose the default launcher. This is preferable to simply launching
                // the HOME intent which immediately goes to the home screen and
                // backgrounds the app.
                Intent intent = new Intent(android.provider.Settings.ACTION_HOME_SETTINGS);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to open launcher chooser", e);
            }
        }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null) {
            call.reject("Package name missing");
            return;
        }

        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app settings", e);
        }
    }
}
