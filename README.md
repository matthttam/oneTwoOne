# oneTwoOne
A simple extension to prevent students from using other 1:1 Chromebooks

Special thanks to jay0lee for the original application, which served as the basis for my forked version. You can find the original code at https://github.com/jay0lee/oneTwoOne/. I'm grateful for their contributions to the open-source community!

# Deployment Guide
__WARNING__: We have been using this extension for years now and it works great. This latest version provides configuration options from the Google Admin console that allow customizations regarding some blocking features. This extension is published as a full Chrome Web Store extension and deployment from our local repository is no longer supported.

### Populate the location attribute of Chrome devices with comma separated list of allowed user logins.

A few examples:

Limit device to one user account:
```
Location: rgeorge6549@acme.edu
```
allow the following three students to use the device
```
Location: jsmith7877@acme.edu,tgregg4343@acme.edu,fscott2498@acme.edu
```
We don't really care what else is in the field as long as the email and comma are there:
```
Location: George Washington High,pswanson0937@acme.edu
```
Wildcard * allows any user for lab devices:
```
Location: *

Location: 4th grade lab rm122,*
```
if Location is empty, the device is unmanaged, the device is managed by another G Suite instance or the extension is running on a non-Chrome OS platform (Windows/Mac/Linux) then the extension should allow regular access.

### Force the extension to students who should be locked down
__WARNING__: It is recommended to install this extension from the Chrome Web Store.


1. admin.google.com > 3 bar menu at top left > Devices > Chrome management > Apps & extensions
1. Choose student OU to the left. Be sure not to include staff/teachers. Anyone who does not get the extension will be able to sign in to any device.
1. Yellow + circle at bottom right > yellow "chrome" icon with tooltip "Add from Chrome Web Store".
1. Search for OneTwoOne or past the following ID in the View app by ID section ```djkcpblgmmdnielnpleekpaliebjhdgc```
1. Click save. Now in the list of extensions change ```djkcpblgmmdnielnpleekpaliebjhdgc``` from "Allow install" to "Force install". Click save at top right.

To use the hosted version (not recommended):  
1. admin.google.com > 3 bar menu at top left > Devices > Chrome management > Apps & extensions
1. Choose student testing OU to the left.
1. Yellow + circle at bottom right > yellow "grid" icon with tooltip "add Chrome app or extension by ID".
1. Extension ID: jnanjcpghahljpllmojibnjehekidnnk
1. Switch dropdown to "From a custom URL"
1. URL: https://files.tradition1871.com/oneTwoOne/update.xml
1. Set Update URL to "Installation URL (see above)"
1. Click save. Now in the list of extensions change jnanjcpghahljpllmojibnjehekidnnk from "Allow install" to "Force install". Click save at top right.

### Optional Configuration
Modify the extension configuration under the "Policy for extensions" section in Google Admin. Paste the following json object into that section for the default configuration:
```
{
    "BlockPage": {
        "Value":""
    },
    "UnblockPatterns": {
        "Value": [
        ]
    }
}
```
If no configuration is provided or the above configuration is used, a built-in block page is presented that tells the user who the assigned user is and the user must match the assigned user (location field) or they will be blocked form all pages.

You can customize this behaivor in the following ways:  
__BlockPage__: Provide a full URL (e.g. _https://www.google.com/search?q=oneTwoOne+Extension_) and the user will be redirected to this webpage. Note they can navigate all of this webpage and subdomains if they choose to do so. A Search Param of user=*assigned user* will be added to the cusotm block page for your use.  
__UnblockPatterns__: Provide a list of regular expressions. If the assigned user matches any of these expressions nothing will be blocked. This is useful if you want students to be able to use a staff assigned device.

#### Example
```
{
    "BlockPage": {
        "Value":"https://mycustomblockpage.example.com"
    },
    "UnblockPatterns": {
        "Value": [
            ".*@district.kyschools.us"
        ]
    }
}
```
The above configuration will load a block page of mycustomblockpage.example.com for any site except mycustomblockpage.example.com and for any user not assigned the device unless the user assigned matches .*@district.kyschools.us

### Things to test
- It can take a while for changes to device location attribute to reach the device. Go to chrome://policy and force a refresh to speed up testing.
- Confirm student listed in location is able to login and access websites as usual.
- Confirm student not listed in location gets a popup on login and gets redirected to block page when browsing web.
- Confirm teacher and admin accounts that don't get the extension force installed won't be locked out of any device.
- You can get details about what the extension is doing in the extension console. chrome://extensions > oneTwo > background page > console tab. You'll want to allow devtools for force installed extensions while testing but block it in production to keep students from being able to kill the extension.
- The extension is currently comparing the user's email address against the device's location attribute because both of these attributes can be read by the extension _without Internet access_. This means students can't do a timed disconnect of Internet in order to break the extension. Future versions may support mapping students to devices with other fields.
