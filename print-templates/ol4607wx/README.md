# OL4607WX label template for InDesign

InDesign template for [OnlineLabels OL4607WX](https://www.onlinelabels.com/products/ol4607wx) sheets (2.5" × 1" Standard White Matte, 24 per sheet).

| File | What it is |
| --- | --- |
| `OL4607WX-labels.idml` | The template. Open it in InDesign CS6 or any CC version. |
| `OL4607WX-alignment-test.pdf` | A plain-paper test sheet for checking your printer's alignment. |
| `OL4607WX-build-template.jsx` | Backup: an InDesign script that builds the same template natively. |
| `build_template.py` | Regenerates the IDML and test PDF (`python3 build_template.py`). |

## Sheet specs

| Spec | Value |
| --- | --- |
| Sheet | US Letter, 8.5" × 11" |
| Label size | 2.5" × 1" with a 0.0625" corner radius |
| Labels per sheet | 24: 3 columns × 8 rows |
| Top / bottom margin | 0.625" |
| Left / right margin | 0.325" |
| Gap between columns / rows | 0.175" / 0.25" |
| Horizontal / vertical pitch | 2.675" / 1.25" |

The label positions are:

- Columns start at 0.325", 3.000" and 5.675" from the left edge.
- Rows start at 0.625" from the top and repeat every 1.25".

## What's in the template

- **Label Text layer:** 24 empty text frames, one per label, named "Label 01 (row 1, col 1)" through "Label 24". Text is centered horizontally and vertically, with a 1/16" inset so it stays clear of the die cut.
- **Label Outlines (non-printing) layer:** rounded outlines of each label in magenta on the A-OL4607WX master page. This layer is locked and set not to print or export.
- **Margin and column guides:** these match the label columns.
- **Paragraph styles** (all in Arial and centered):
  - **Label Title:** Bold 12/14
  - **Label Text:** 10/12. This is the default in every frame.
  - **Label Small:** 8/9.5
- **Units:** inches.

## Using it

1. In InDesign, choose **File › Open** and pick `OL4607WX-labels.idml`. Then use **File › Save As** and choose **InDesign Template (.indt)** to keep a reusable copy.
2. Double-click a label frame and paste your text.
   - **Edit › Paste without Formatting** (⇧⌘V on Mac, Ctrl+Shift+V on Windows) keeps the label style.
   - A plain paste brings in the source's fonts and sizes.
3. If text doesn't fit, a red **+** appears at the frame's bottom-right corner. Shorten the text or switch the paragraph to **Label Small**.
4. **More sheets:** in the Pages panel, right-click the page and choose **Duplicate Spread**. Each new page gets its own 24 frames.
5. **Printing from InDesign:** choose **File › Print**.
   - **Setup:** set Paper Size to **Letter** and Scale to **100%**. Leave **Scale to Fit** off.
   - **Printer:** in the printer's own settings, choose the **Labels** or heavyweight paper type. Feed sheets as your printer's manual says.
6. **Printing from a PDF:** export the PDF first, then print it at **Actual size**. Don't use "Fit".

### Check alignment first

1. Print `OL4607WX-alignment-test.pdf` on plain paper at 100% (Actual Size).
2. Hold it behind a label sheet up to a light.

If every label is off by the same amount, your printer feed is shifting the page. To fix it:

1. With the Selection tool, choose **Edit › Select All**. Only the text frames get selected, because the outlines layer is locked.
2. Move them with **Object › Transform › Move** by the offset you measured.

## If the IDML won't open

Run the backup script instead:

1. In InDesign, go to **Window › Utilities › Scripts**.
2. Right-click the **User** folder and choose **Reveal in Finder/Explorer**.
3. Copy `OL4607WX-build-template.jsx` into that folder.
4. Double-click the script in the Scripts panel. It creates the same document directly in InDesign.

## Filling many labels from a spreadsheet

For long lists, use InDesign's **Data Merge** (Window › Utilities › Data Merge) with a CSV file:

1. Put the merge fields in the Label 01 frame.
2. Delete the other 23 frames.
3. Choose **Create Merged Document** and set **Records per Document Page** to **Multiple Records**.
4. Under **Multiple Record Layout**, enter these values:
   - Margins: top/bottom **0.625"**, left/right **0.325"**
   - Spacing: **0.25"** between rows, **0.175"** between columns
