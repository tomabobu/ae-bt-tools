this.colorSwatches.saveFileFromJSX = function(defaultName, data) {
    try {
        var file = File.saveDialog("Save Swatch Library as .json file");
        if (!file) return "cancelled";
        file.open("w");
        file.write(data);
        file.close();
        return "success";
    } catch (err) {
        alert("Error saving file: " + err.message);
        return "error";
    }
}