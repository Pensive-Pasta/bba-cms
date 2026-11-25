"""Read the two supplied XLSX worksheets without modifying the workbook."""
import collections
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
import zipfile

path = sys.argv[1]
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(path) as archive:
    shared = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", ns)]
    relationships = {item.attrib["Id"]: item.attrib["Target"] for item in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    sheets = {}
    for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("m:sheets/m:sheet", ns):
        target = relationships[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        rows = []
        for row in ET.fromstring(archive.read(target)).findall("m:sheetData/m:row", ns):
            values = {"row": int(row.attrib["r"])}
            for cell in row.findall("m:c", ns):
                assert cell.find("m:f", ns) is None, "Formula cells need explicit review before import"
                value = cell.find("m:v", ns)
                text = ""
                if cell.attrib.get("t") == "inlineStr":
                    text = "".join(cell.find("m:is", ns).itertext())
                elif value is not None:
                    text = shared[int(value.text)] if cell.attrib.get("t") == "s" else value.text
                if text:
                    values["".join(character for character in cell.attrib["r"] if character.isalpha())] = text.strip()
            if len(values) > 1:
                rows.append(values)
        sheets[sheet.attrib["name"]] = rows

full = sheets["BBA Project Index"]
website = sheets["Simplified Table for Website"]
assert [full[0][column] for column in "ADGHIJOP"] == ["Project Number", "Typology", "Public Project Name", "Index", "Case Study", "Context", "Outward Postcode", "County"]
assert [website[0][column] for column in "ABCDE"] == ["Name", "Code", "County", "Context", "Typology"]
selected = [row for row in full[1:] if row.get("H") == "Yes"]
assert len(selected) == 120 and len(website[1:]) == 120, "The approved source selection has changed; review before importing"
by_name = {row["G"]: row for row in selected}
assert len(by_name) == len(selected), "Duplicate public names need review"
records = []
omitted = []
for row in website[1:]:
    original = by_name[row["A"]]
    assert all(row.get(column) == original.get(source) for column, source in zip("ABCDE", "GOPJD")), "Website and full index disagree"
    record = {
        "projectNumber": original["A"], "title": row["A"], "postCode": row["B"],
        "county": row["C"], "type": row["D"].lower(), "typology": row["E"],
        "caseStudyMarker": original["I"] == "Yes", "sourceRow": original["row"],
        "notes": original.get("Q", ""),
    }
    assert record["type"] in ["urban", "inter-urban", "rural"], "Unknown context"
    assert record["typology"] in ["Private Residential", "Residential", "Workplace", "Community", "Sport", "Retail"], "Unknown typology"
    # Omission notes are source data explicitly requested for reconciliation.
    if "omit from website" in record["notes"].lower():
        omitted.append(record)
    else:
        records.append(record)
numbers = collections.defaultdict(list)
for row in full[1:]:
    numbers[row["A"]].append(row["row"])
assert len({record["projectNumber"] for record in records}) == len(records), "Selected project numbers must be unique"
print(json.dumps({
    "sourceSha256": hashlib.sha256(open(path, "rb").read()).hexdigest(),
    "websiteRows": len(website[1:]), "records": records, "omitted": omitted,
    "duplicateNumbers": {number: rows for number, rows in numbers.items() if len(rows) > 1},
    "omissionNotes": [{"projectNumber": row["A"], "notes": row["Q"]} for row in full[1:] if row.get("Q")],
}, ensure_ascii=False))
