// Builds an OnlineLabels OL4607WX label template in Adobe InDesign.
// 2.5" x 1" rounded labels, 24 per US Letter sheet (3 columns x 8 rows).
//
// Backup for OL4607WX-labels.idml: in InDesign open Window > Utilities > Scripts,
// right-click the "User" folder > Reveal in Finder/Explorer, copy this file there,
// then double-click it in the Scripts panel.
#target indesign

(function () {
    var PT = 72; // points per inch
    var S = {
        pageW: 8.5, pageH: 11,
        cols: 3, rows: 8,
        labelW: 2.5, labelH: 1,
        top: 0.625, bottom: 0.625, left: 0.325, right: 0.325,
        hPitch: 2.675, vPitch: 1.25, // label size + 0.175" / 0.25" gaps
        radius: 0.0625,
        inset: 0.0625 // keep text 1/16" inside the die cut
    };

    var oldUnits = app.scriptPreferences.measurementUnit;
    app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
    var preset = null;
    try {
        preset = app.documentPresets.add({
            name: "OL4607WX build " + new Date().getTime(),
            facingPages: false,
            pagesPerDocument: 1,
            pageWidth: S.pageW * PT,
            pageHeight: S.pageH * PT,
            top: S.top * PT,
            bottom: S.bottom * PT,
            left: S.left * PT,
            right: S.right * PT,
            columnCount: S.cols,
            columnGutter: (S.hPitch - S.labelW) * PT,
            documentBleedUniformSize: true,
            documentBleedTopOffset: 0
        });
        var doc = app.documents.add(true, preset);

        var master = doc.masterSpreads[0];
        master.baseName = "OL4607WX";

        var textLayer = doc.layers[0];
        textLayer.name = "Label Text";
        textLayer.layerColor = UIColors.LIGHT_BLUE;
        var outlineLayer = doc.layers.add({ name: "Label Outlines (non-printing)", layerColor: UIColors.MAGENTA });
        outlineLayer.move(LocationOptions.AT_END);

        var none = doc.swatches.itemByName("None");
        var outlineColor = doc.colors.add({
            name: "Label Outline", model: ColorModel.PROCESS, space: ColorSpace.CMYK, colorValue: [0, 100, 0, 0]
        });

        function addStyle(name, size, leading, fontStyle) {
            var st = doc.paragraphStyles.add({
                name: name, pointSize: size, leading: leading,
                justification: Justification.CENTER_ALIGN, hyphenation: false
            });
            try {
                st.appliedFont = "Arial";
                st.fontStyle = fontStyle;
            } catch (e) {} // keep InDesign's default font if Arial is missing
            return st;
        }
        addStyle("Label Title", 12, 14, "Bold");
        var body = addStyle("Label Text", 10, 12, "Regular");
        addStyle("Label Small", 8, 9.5, "Regular");

        // New text frames (ours and any the user draws later) start centered with a safe inset.
        doc.textDefaults.appliedParagraphStyle = body;
        var tfp = doc.textFramePreferences;
        var inset = S.inset * PT;
        tfp.insetSpacing = [inset, inset, inset, inset];
        tfp.verticalJustification = VerticalJustification.CENTER_ALIGN;

        var page = doc.pages[0];
        var masterPage = master.pages[0];
        var radius = S.radius * PT;
        var n = 0;
        for (var r = 0; r < S.rows; r++) {
            for (var c = 0; c < S.cols; c++) {
                n++;
                var y1 = (S.top + r * S.vPitch) * PT;
                var x1 = (S.left + c * S.hPitch) * PT;
                var bounds = [y1, x1, y1 + S.labelH * PT, x1 + S.labelW * PT];
                var num = (n < 10 ? "0" : "") + n;

                masterPage.rectangles.add(outlineLayer, undefined, undefined, {
                    name: "Outline " + num,
                    geometricBounds: bounds,
                    fillColor: none, strokeColor: outlineColor, strokeWeight: 0.5,
                    topLeftCornerOption: CornerOptions.ROUNDED_CORNER, topLeftCornerRadius: radius,
                    topRightCornerOption: CornerOptions.ROUNDED_CORNER, topRightCornerRadius: radius,
                    bottomLeftCornerOption: CornerOptions.ROUNDED_CORNER, bottomLeftCornerRadius: radius,
                    bottomRightCornerOption: CornerOptions.ROUNDED_CORNER, bottomRightCornerRadius: radius
                });

                page.textFrames.add(textLayer, undefined, undefined, {
                    name: "Label " + num + " (row " + (r + 1) + ", col " + (c + 1) + ")",
                    geometricBounds: bounds,
                    fillColor: none, strokeColor: none
                });
            }
        }

        outlineLayer.printable = false;
        outlineLayer.locked = true;
        doc.activeLayer = textLayer;

        var vp = doc.viewPreferences;
        vp.horizontalMeasurementUnits = MeasurementUnits.INCHES;
        vp.verticalMeasurementUnits = MeasurementUnits.INCHES;
        vp.rulerOrigin = RulerOrigin.PAGE_ORIGIN;

        alert("OL4607WX template ready: 24 text frames on page 1.\n\n" +
            "Save it with File > Save As > InDesign Template (.indt).");
    } finally {
        if (preset && preset.isValid) {
            preset.remove();
        }
        app.scriptPreferences.measurementUnit = oldUnits;
    }
})();
