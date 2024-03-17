import yaml
from yaml.loader import FullLoader
from icecream import ic
import copy

with open("cloudflare.yaml") as f, open("cloudflare-filtered.yaml", "w") as f_out:
    data = yaml.load(f, Loader=FullLoader)
    data_new = copy.deepcopy(data)
    for path in data["paths"]:
        ic(path)
        for key in data["paths"][path]:
            if "ai" not in key:
                if path in data_new["paths"]:
                    del data_new["paths"][path]
    yaml.dump(data_new, f_out, sort_keys=False, default_flow_style=False)
