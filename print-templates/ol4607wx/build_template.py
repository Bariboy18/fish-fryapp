#!/usr/bin/env python3
"""Build an InDesign (IDML) label template for OnlineLabels OL4607WX sheets.

OL4607WX: 2.5" x 1" rounded-corner labels, 24 per US Letter sheet
(3 columns x 8 rows). Run:

    python3 build_template.py                 # writes OL4607WX-labels.idml
    python3 build_template.py --sample out.idml  # same layout, filled with sample text

Open the .idml in InDesign (File > Open), then File > Save As > InDesign
Template (.indt) to keep it as a reusable template.
"""

import argparse
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

PT = 72.0  # points per inch

# Sheet specs (inches), from the OnlineLabels OL4607 product/template pages.
PAGE_W, PAGE_H = 8.5, 11.0
COLS, ROWS = 3, 8
LABEL_W, LABEL_H = 2.5, 1.0
MARGIN_TOP, MARGIN_BOTTOM = 0.625, 0.625
MARGIN_LEFT, MARGIN_RIGHT = 0.325, 0.325
H_PITCH, V_PITCH = 2.675, 1.25  # label width + 0.175" gap, label height + 0.25" gap
CORNER_RADIUS = 0.0625
TEXT_INSET = 0.0625  # keep text 1/16" inside the die cut

DOM = "8.0"  # IDML from InDesign CS6, so every CS6+/CC version can open it
PKG_NS = "http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"
XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

assert abs(MARGIN_LEFT + (COLS - 1) * H_PITCH + LABEL_W + MARGIN_RIGHT - PAGE_W) < 1e-9
assert abs(MARGIN_TOP + (ROWS - 1) * V_PITCH + LABEL_H + MARGIN_BOTTOM - PAGE_H) < 1e-9


def pt(inches):
    return round(inches * PT, 4)


def num(v):
    return f"{v:.4f}".rstrip("0").rstrip(".")


# Spread coordinates: a single page in a non-facing document is centered on the
# spread origin, so the page spans x -W/2..W/2 and y -H/2..H/2.
PAGE_W_PT, PAGE_H_PT = pt(PAGE_W), pt(PAGE_H)
X_OFFSET, Y_OFFSET = -PAGE_W_PT / 2, -PAGE_H_PT / 2


def label_boxes():
    """Yield (index, row, col, x1, y1, x2, y2) in spread coordinates, points."""
    n = 0
    for r in range(ROWS):
        for c in range(COLS):
            n += 1
            x1 = pt(MARGIN_LEFT + c * H_PITCH) + X_OFFSET
            y1 = pt(MARGIN_TOP + r * V_PITCH) + Y_OFFSET
            yield n, r, c, x1, y1, x1 + pt(LABEL_W), y1 + pt(LABEL_H)


def path_geometry(x1, y1, x2, y2):
    pts = [(x1, y1), (x1, y2), (x2, y2), (x2, y1)]
    rows = "".join(
        f'<PathPointType Anchor="{num(x)} {num(y)}" LeftDirection="{num(x)} {num(y)}" '
        f'RightDirection="{num(x)} {num(y)}"/>'
        for x, y in pts
    )
    return (
        "<Properties><PathGeometry><GeometryPathType PathOpen=\"false\"><PathPointArray>"
        f"{rows}</PathPointArray></GeometryPathType></PathGeometry></Properties>"
    )


def corners(radius_pt):
    return "".join(
        f' {k}CornerOption="RoundedCorner" {k}CornerRadius="{num(radius_pt)}"'
        for k in ("TopLeft", "TopRight", "BottomLeft", "BottomRight")
    )


def margin_pref():
    col_w = (PAGE_W_PT - pt(MARGIN_LEFT) - pt(MARGIN_RIGHT) - (COLS - 1) * pt(H_PITCH - LABEL_W)) / COLS
    positions, x = [], 0.0
    for _ in range(COLS):
        positions += [x, x + col_w]
        x += col_w + pt(H_PITCH - LABEL_W)
    return (
        f'<MarginPreference ColumnCount="{COLS}" ColumnGutter="{num(pt(H_PITCH - LABEL_W))}" '
        f'Top="{num(pt(MARGIN_TOP))}" Bottom="{num(pt(MARGIN_BOTTOM))}" '
        f'Left="{num(pt(MARGIN_LEFT))}" Right="{num(pt(MARGIN_RIGHT))}" '
        f'ColumnDirection="Horizontal" ColumnsPositions="{" ".join(num(p) for p in positions)}"/>'
    )


def page_xml(self_id, name, applied_master):
    return (
        f'<Page Self="{self_id}" Name="{name}" AppliedMaster="{applied_master}" OverrideList="" '
        f'GeometricBounds="0 0 {num(PAGE_H_PT)} {num(PAGE_W_PT)}" '
        f'ItemTransform="1 0 0 1 {num(X_OFFSET)} {num(Y_OFFSET)}" MasterPageTransform="1 0 0 1 0 0">'
        f"{margin_pref()}</Page>"
    )


IDS = {
    "layer_text": "ub0",
    "layer_outline": "ub1",
    "master": "uc0",
    "master_page": "uc1",
    "spread": "ud0",
    "page": "ud1",
    "section": "ud2",
}


def frame_id(n):
    return f"u{0x200 + n:x}"


def story_id(n):
    return f"u{0x300 + n:x}"


def outline_id(n):
    return f"u{0x400 + n:x}"


def graphic_xml():
    return XML_HEAD + f"""<idPkg:Graphic xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">
<Color Self="Color/Black" Model="Process" Space="CMYK" ColorValue="0 0 0 100" ColorOverride="Specialblack" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Black" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>
<Color Self="Color/Paper" Model="Process" Space="CMYK" ColorValue="0 0 0 0" ColorOverride="Specialpaper" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Paper" ColorEditable="true" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>
<Color Self="Color/Registration" Model="Registration" Space="CMYK" ColorValue="100 100 100 100" ColorOverride="Specialregistration" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Registration" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>
<Color Self="Color/Label Outline" Model="Process" Space="CMYK" ColorValue="0 100 0 0" ColorOverride="Normal" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Label Outline" ColorEditable="true" ColorRemovable="true" Visible="true" SwatchCreatorID="7937"/>
<StrokeStyle Self="StrokeStyle/$ID/Solid" Name="$ID/Solid"/>
<Swatch Self="Swatch/None" Name="None" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>
</idPkg:Graphic>
"""


def para_style(name, size, leading, font_style):
    return (
        f'<ParagraphStyle Self="ParagraphStyle/{name}" Name="{name}" Imported="false" '
        f'NextStyle="ParagraphStyle/{name}" KeyboardShortcut="0 0" PointSize="{size}" '
        f'FontStyle="{font_style}" Justification="CenterAlign" Hyphenation="false" '
        f'FillColor="Color/Black">'
        "<Properties>"
        '<BasedOn type="object">ParagraphStyle/$ID/NormalParagraphStyle</BasedOn>'
        '<PreviewColor type="enumeration">Nothing</PreviewColor>'
        '<AppliedFont type="string">Arial</AppliedFont>'
        f'<Leading type="unit">{leading}</Leading>'
        "</Properties></ParagraphStyle>"
    )


def styles_xml():
    return XML_HEAD + f"""<idPkg:Styles xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">
<RootCharacterStyleGroup Self="u60">
<CharacterStyle Self="CharacterStyle/$ID/[No character style]" Imported="false" Name="$ID/[No character style]"/>
</RootCharacterStyleGroup>
<RootParagraphStyleGroup Self="u61">
<ParagraphStyle Self="ParagraphStyle/$ID/[No paragraph style]" Name="$ID/[No paragraph style]" Imported="false" KeyboardShortcut="0 0"/>
<ParagraphStyle Self="ParagraphStyle/$ID/NormalParagraphStyle" Name="$ID/NormalParagraphStyle" Imported="false" NextStyle="ParagraphStyle/$ID/NormalParagraphStyle" KeyboardShortcut="0 0"><Properties><BasedOn type="string">$ID/[No paragraph style]</BasedOn><PreviewColor type="enumeration">Nothing</PreviewColor></Properties></ParagraphStyle>
{para_style("Label Title", 12, 14, "Bold")}
{para_style("Label Text", 10, 12, "Regular")}
{para_style("Label Small", 8, 9.5, "Regular")}
</RootParagraphStyleGroup>
</idPkg:Styles>
"""


def preferences_xml():
    return XML_HEAD + f"""<idPkg:Preferences xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">
<DocumentPreference PageHeight="{num(PAGE_H_PT)}" PageWidth="{num(PAGE_W_PT)}" PagesPerDocument="1" FacingPages="false" DocumentBleedTopOffset="0" DocumentBleedBottomOffset="0" DocumentBleedInsideOrLeftOffset="0" DocumentBleedOutsideOrRightOffset="0" DocumentBleedUniformSize="true" SlugTopOffset="0" SlugBottomOffset="0" SlugInsideOrLeftOffset="0" SlugRightOrOutsideOffset="0" DocumentSlugUniformSize="true" AllowPageShuffle="true" PageBinding="LeftToRight" ColumnGuideLocked="true" MasterTextFrame="false" Intent="PrintIntent"/>
{margin_pref()}
<ViewPreference HorizontalMeasurementUnits="Inches" VerticalMeasurementUnits="Inches" RulerOrigin="PageOrigin"/>
</idPkg:Preferences>
"""


def master_spread_xml():
    outlines = []
    for n, r, c, x1, y1, x2, y2 in label_boxes():
        outlines.append(
            f'<Rectangle Self="{outline_id(n)}" Name="Outline {n:02d}" ContentType="Unassigned" '
            f'ItemLayer="{IDS["layer_outline"]}" Locked="false" Visible="true" '
            f'FillColor="Swatch/None" StrokeColor="Color/Label Outline" StrokeWeight="0.5" '
            f'ItemTransform="1 0 0 1 0 0"{corners(pt(CORNER_RADIUS))}>'
            f"{path_geometry(x1, y1, x2, y2)}</Rectangle>"
        )
    return XML_HEAD + (
        f'<idPkg:MasterSpread xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">'
        f'<MasterSpread Self="{IDS["master"]}" ItemTransform="1 0 0 1 0 0" ShowMasterItems="true" '
        f'PageCount="1" NamePrefix="A" BaseName="OL4607WX" Name="A-OL4607WX">'
        f'{page_xml(IDS["master_page"], "A", "n")}'
        + "\n".join(outlines)
        + "</MasterSpread></idPkg:MasterSpread>\n"
    )


def spread_xml():
    inset = num(pt(TEXT_INSET))
    frames = []
    for n, r, c, x1, y1, x2, y2 in label_boxes():
        frames.append(
            f'<TextFrame Self="{frame_id(n)}" Name="Label {n:02d} (row {r + 1}, col {c + 1})" '
            f'ParentStory="{story_id(n)}" PreviousTextFrame="n" NextTextFrame="n" '
            f'ContentType="TextType" ItemLayer="{IDS["layer_text"]}" Locked="false" Visible="true" '
            f'FillColor="Swatch/None" StrokeColor="Swatch/None" StrokeWeight="0" '
            f'ItemTransform="1 0 0 1 0 0">'
            f"{path_geometry(x1, y1, x2, y2)}"
            '<TextFramePreference TextColumnCount="1" VerticalJustification="CenterAlign" '
            'FirstBaselineOffset="AscentOffset" IgnoreWrap="false">'
            '<Properties><InsetSpacing type="list">'
            + f'<ListItem type="unit">{inset}</ListItem>' * 4
            + "</InsetSpacing></Properties></TextFramePreference></TextFrame>"
        )
    return XML_HEAD + (
        f'<idPkg:Spread xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">'
        f'<Spread Self="{IDS["spread"]}" ShowMasterItems="true" PageCount="1" '
        f'AllowPageShuffle="true" ItemTransform="1 0 0 1 0 0">'
        f'{page_xml(IDS["page"], "1", IDS["master"])}'
        + "\n".join(frames)
        + "</Spread></idPkg:Spread>\n"
    )


def story_xml(n, text):
    if text:
        lines = text.split("\n")
        style = "Label Title"
        body = []
        for i, line in enumerate(lines):
            body.append(
                f'<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/{style}">'
                '<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">'
                f"<Content>{escape(line)}</Content>"
                + ("<Br/>" if i < len(lines) - 1 else "")
                + "</CharacterStyleRange></ParagraphStyleRange>"
            )
            style = "Label Text"
        content = "".join(body)
    else:
        content = (
            '<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/Label Text">'
            '<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]"/>'
            "</ParagraphStyleRange>"
        )
    return XML_HEAD + (
        f'<idPkg:Story xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}">'
        f'<Story Self="{story_id(n)}" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="$ID/" AppliedNamedGrid="n">'
        '<StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType" '
        'StoryOrientation="Horizontal" StoryDirection="LeftToRightDirection"/>'
        f"{content}</Story></idPkg:Story>\n"
    )


def designmap_xml(n_labels):
    stories = [story_id(n) for n in range(1, n_labels + 1)]
    story_refs = "\n".join(f'<idPkg:Story src="Stories/Story_{s}.xml"/>' for s in stories)
    return XML_HEAD + f"""<?aid style="50" type="document" readerVersion="6.0" featureSet="257" product="8.0(370)" ?>
<Document xmlns:idPkg="{PKG_NS}" DOMVersion="{DOM}" Self="d" StoryList="{" ".join(stories)}" ZeroPoint="0 0" ActiveLayer="{IDS["layer_text"]}">
<idPkg:Graphic src="Resources/Graphic.xml"/>
<idPkg:Styles src="Resources/Styles.xml"/>
<idPkg:Preferences src="Resources/Preferences.xml"/>
<Layer Self="{IDS["layer_text"]}" Name="Label Text" Visible="true" Locked="false" IgnoreWrap="false" ShowGuides="true" LockGuides="false" UI="true" Expendable="true" Printable="true"><Properties><LayerColor type="enumeration">LightBlue</LayerColor></Properties></Layer>
<Layer Self="{IDS["layer_outline"]}" Name="Label Outlines (non-printing)" Visible="true" Locked="true" IgnoreWrap="false" ShowGuides="true" LockGuides="false" UI="true" Expendable="true" Printable="false"><Properties><LayerColor type="enumeration">Magenta</LayerColor></Properties></Layer>
<idPkg:MasterSpread src="MasterSpreads/MasterSpread_{IDS["master"]}.xml"/>
<idPkg:Spread src="Spreads/Spread_{IDS["spread"]}.xml"/>
<Section Self="{IDS["section"]}" Length="1" Name="" ContinueNumbering="true" IncludeSectionPrefix="false" PageNumberStyle="Arabic" PageStart="{IDS["page"]}" SectionPrefix=""/>
{story_refs}
</Document>
"""


CONTAINER_XML = XML_HEAD + """<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="designmap.xml" media-type="text/xml"/></rootfiles>
</container>
"""


def build(out_path, sample=False):
    n_labels = ROWS * COLS
    files = {
        "META-INF/container.xml": CONTAINER_XML,
        "designmap.xml": designmap_xml(n_labels),
        "Resources/Graphic.xml": graphic_xml(),
        "Resources/Styles.xml": styles_xml(),
        "Resources/Preferences.xml": preferences_xml(),
        f"MasterSpreads/MasterSpread_{IDS['master']}.xml": master_spread_xml(),
        f"Spreads/Spread_{IDS['spread']}.xml": spread_xml(),
    }
    for n in range(1, n_labels + 1):
        text = f"Label {n:02d}\nSample line two\nSample line three" if sample else ""
        files[f"Stories/Story_{story_id(n)}.xml"] = story_xml(n, text)

    with zipfile.ZipFile(out_path, "w") as z:
        # The mimetype entry must come first and be stored uncompressed.
        z.writestr(zipfile.ZipInfo("mimetype"), "application/vnd.adobe.indesign-idml-package",
                   compress_type=zipfile.ZIP_STORED)
        for name, data in files.items():
            z.writestr(name, data.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
    return out_path


def build_alignment_pdf(out_path):
    """Plain-paper test sheet: print at 100% and hold it behind a label sheet."""
    from reportlab.lib.colors import CMYKColor
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(str(out_path), pagesize=(PAGE_W_PT, PAGE_H_PT))
    c.setTitle("OL4607WX alignment test")
    w, h, inset = pt(LABEL_W), pt(LABEL_H), pt(TEXT_INSET)
    for n, r, col, x1, y1, x2, y2 in label_boxes():
        # Spread coordinates (y down, centered) -> PDF coordinates (y up, from bottom-left).
        x, y = x1 - X_OFFSET, PAGE_H_PT - (y1 - Y_OFFSET) - h
        c.setLineWidth(0.5)
        c.setStrokeColor(CMYKColor(0, 1, 0, 0))
        c.roundRect(x, y, w, h, pt(CORNER_RADIUS))
        c.setStrokeColor(CMYKColor(0, 0, 0, 0.4))
        c.setDash(2, 2)
        c.rect(x + inset, y + inset, w - 2 * inset, h - 2 * inset)
        c.setDash()
        c.setFillColor(CMYKColor(0, 0, 0, 0.6))
        c.setFont("Helvetica", 7)
        c.drawCentredString(x + w / 2, y + h / 2 - 2.5, f"Label {n}  (row {r + 1}, col {col + 1})")
    c.setFillColor(CMYKColor(0, 0, 0, 1))
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(PAGE_W_PT / 2, PAGE_H_PT - pt(0.35),
                        "OL4607WX alignment test - print on plain paper at 100% / Actual Size, "
                        "then hold it behind a label sheet up to a light.")
    c.drawCentredString(PAGE_W_PT / 2, pt(0.32),
                        '2.5" x 1" labels, 24 per sheet (3 x 8). Solid line = label edge, '
                        'dashed line = 1/16" text safe area.')
    c.showPage()
    c.save()
    return out_path


if __name__ == "__main__":
    here = Path(__file__).parent
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out", nargs="?", default=str(here / "OL4607WX-labels.idml"))
    ap.add_argument("--sample", action="store_true", help="fill every label with sample text")
    args = ap.parse_args()
    print(build(args.out, sample=args.sample))
    if not args.sample:
        try:
            print(build_alignment_pdf(here / "OL4607WX-alignment-test.pdf"))
        except ImportError:
            print("reportlab not installed; skipped OL4607WX-alignment-test.pdf")
