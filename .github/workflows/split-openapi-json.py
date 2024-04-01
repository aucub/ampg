import json
import copy

with open("cloudflare.json", "r") as f, open("cloudflare-filtered.json", "w") as f_out:
    data = json.load(f)
    data_new = copy.deepcopy(data)

    sections_to_keep = [
        "paths",
        "openapi",
        "tags",
        "info",
        "security",
        "servers",
    ]

    for section in list(data_new.keys()):
        if section not in sections_to_keep:
            del data_new[section]

    paths = list(data["paths"].keys())
    for path in paths:
        if "ai/run" not in path:
            if path in data_new["paths"]:
                del data_new["paths"][path]

    json.dump(data_new, f_out, indent=2)
