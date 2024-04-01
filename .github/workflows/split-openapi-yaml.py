import yaml
from yaml.loader import FullLoader
import copy

with open("cloudflare.yaml") as f, open("cloudflare-filtered.yaml", "w") as f_out:
    data = yaml.load(f, Loader=FullLoader)
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

    yaml.dump(data_new, f_out, sort_keys=False, default_flow_style=False)
