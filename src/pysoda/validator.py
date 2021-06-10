# -*- coding: utf-8 -*-

### Import required python modules

from sparcur.paths import Path as SparCurPath
from sparcur.utils import PennsieveId
from sparcur.simple.retrieve import main as retrieve
from sparcur.simple.validate import main as validate
from configparser import ConfigParser
import os.path
import shutil
import yaml
# from pathlib import Path

userpath = SparCurPath.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')

local_sparc_dataset_location = "~/files/sparc-datasets"
sparc_organization_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"

parent_folder = SparCurPath(local_sparc_dataset_location).expanduser()
orthauth_path = SparCurPath('~/.config/orthauth').expanduser()
orthauth_path_secrets = orthauth_path + "/secrets.yaml"
pyontutils_path = SparCurPath('~/.config/pyontutils').expanduser()
pyontutils_path_config = pyontutils_path + "/config.yaml"

orthauth_path_secrets_min_template = {
    "pennsieve": {
        "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0": { 
             "key": "", 
             "secret": ""
            }
        }
    }

pyonutils_config = {
    'auth-stores': {
        'secrets': {
            'path': '{:user-config-path}/orthauth/secrets.yaml'
            }
        },
    'auth-variables': {
        'curies': 'null',
        'git-local-base': 'null',
        'git-remote-base': 'null',
        'google-api-creds-file': 'null',
        'google-api-service-account-file': 'null',
        'google-api-store-file': 'null',
        'google-api-store-file-readonly': 'null',
        'nifstd-checkout-ok': 'null',
        'ontology-local-repo': 'null',
        'ontology-org': 'null',
        'ontology-repo': 'null',
        'patch-config': 'null',
        'resources': 'null',
        'scigraph-api': 'https://scigraph.olympiangods.org/scigraph',
        'scigraph-api-key': 'null',
        'scigraph-graphload': 'null',
        'scigraph-services': 'null',
        'zip-location': 'null'
        }
    }

# If this yaml file doesn't exist, or isn't valid
# delete it and create a fresh copy
def add_orthauth_yaml(ps_account):
    os.chmod(orthauth_path, 0o0700)

    config = ConfigParser()
    if os.path.exists(configpath):
        config.read(configpath)

    yml_obj = orthauth_path_secrets_min_template.copy()

    yml_obj["pennsieve"][sparc_organization_id]["key"] = config[ps_account]["api_token"]
    yml_obj["pennsieve"][sparc_organization_id]["secret"] = config[ps_account]["api_secret"]

    if os.path.exists(orthauth_path_secrets):
        os.remove(orthauth_path_secrets)

    with open(orthauth_path_secrets, 'w') as file:
        yaml.dump(yml_obj, file)

    os.chmod(orthauth_path_secrets, 0o0600)

    return "Valid"

# Check that all the keys are accounted for
def check_prerequisites(ps_account):
    ## pyontutils config
    if not os.path.exists(pyontutils_path):
        pyontutils_path.mkdir(parents=True, exist_ok=True)

    with open(pyontutils_path_config, 'w') as file:
        yaml.dump(pyonutils_config, file)
    
    ## orthauth config
    if not os.path.exists(orthauth_path):
        orthauth_path.mkdir(parents=True, exist_ok=True)

    # Create yaml if doesn't exist
    if os.path.exists(orthauth_path_secrets):
        with open(orthauth_path_secrets) as file:
            yml_obj = yaml.full_load(file)

            if "pennsieve" in yml_obj:
                if sparc_organization_id in yml_obj["pennsieve"]:
                    if "key" in yml_obj["pennsieve"][sparc_organization_id]:
                        if "secret" in yml_obj["pennsieve"][sparc_organization_id]:
                            return "Valid"

    return add_orthauth_yaml(ps_account)

# This pipeline first retrieves a datset to a local folder 
# and then validates the local dataset
def validate_dataset_pipeline(ps_account, ps_dataset):
    
    check_prerequisites(ps_account)

    sparc_dataset_id = ps_dataset
    sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")
    local_dataset_folder_path = ""

    try:
        organization = PennsieveId(sparc_organization_id)
        sparc_dataset = PennsieveId(sparc_dataset_id)
    except Exception as e:
        raise e

    if not os.path.exists(parent_folder):
        parent_folder.mkdir(parents=True, exist_ok=True)

    try:
        if organization != "" and sparc_dataset != "": 
            local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
        else:
            raise Exception("Retrieve Errror")
    except Exception as e:
        raise e

    try:
        validation_json = validate(local_dataset_folder_path)
    except Exception as e:
        raise e

    path_error_report = validation_json["status"]["path_error_report"]

    # Delete the local dataset. 
    # FUTURE: Look into setting an expiration date for this one.
    dir_path = SparCurPath(local_sparc_dataset_location + '/' + sparc_dataset_uuid).expanduser()
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        # no folder present
        print("Error: %s : %s" % (dir_path, e.strerror))

    return path_error_report