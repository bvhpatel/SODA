# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
from sparcur.paths import Path as SparCurPath
from sparcur.utils import PennsieveId
from sparcur.simple.retrieve import main as retrieve
from sparcur.simple.validate import main as validate
from configparser import ConfigParser
import gevent
import os
import os.path
from os.path import join
import sys
import shutil
import yaml
from pennsieve import Pennsieve
from pathlib import Path
import requests

from datetime import datetime, timezone
import dateutil.parser

from pysoda import bf_get_current_user_permission

userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sodavalidatorpath = join(userpath, 'SODA', 'SODA_Validator_Dataset')

def get_home_directory(folder):
    if sys.platform == "win32":
        return str(Path.home()) + "/AppData/Local/" + folder
    elif sys.platform == "linux":
        return str(Path.home()) + "/.config/" + folder
    elif sys.platform == "darwin":
        return str(Path.home()) + "/AppData/Local/" + folder

local_sparc_dataset_location = str(Path.home()) + "/files/sparc-datasets"
sparc_organization_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"
parent_folder = SparCurPath(local_sparc_dataset_location).expanduser()

# for gevent
local_dataset_folder_path = ""
validation_json = {}

# config file locations
orthauth_path = SparCurPath(get_home_directory("orthauth")).expanduser()
orthauth_path_secrets = SparCurPath(get_home_directory("orthauth") + '/secrets.yaml').expanduser()
pyontutils_path = SparCurPath(get_home_directory("pyontutils")).expanduser()
pyontutils_path_config = SparCurPath(get_home_directory("pyontutils") + '/config.yaml').expanduser()

# min template for orthauth config file
orthauth_path_secrets_min_template = {
    "pennsieve": {
        "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0": { 
             "key": "", 
             "secret": ""
            }
        }
    }

# min template for pyontutils config file
pyontutils_config = {
    'auth-stores': {
        'secrets': {
            'path': '{:user-config-path}/orthauth/secrets.yaml'
            }
        },
    'auth-variables': {
        'curies': None,
        'git-local-base': None,
        'git-remote-base': None,
        'google-api-creds-file': None,
        'google-api-service-account-file': None,
        'google-api-store-file': None,
        'google-api-store-file-readonly': None,
        'nifstd-checkout-ok': None,
        'ontology-local-repo': None,
        'ontology-org': None,
        'ontology-repo': None,
        'patch-config': None,
        'resources': None,
        'scigraph-api': "https://scigraph.olympiangods.org/scigraph",
        'scigraph-api-key': None,
        'scigraph-graphload': None,
        'scigraph-services': None,
        'zip-location': None
        }
    }

# If orthauth yaml file doesn't exist, or isn't valid
# delete it and create a fresh copy with the specified Pennsieve account
def add_orthauth_yaml(ps_account):
    os.chmod(orthauth_path, 0o0700) # might not be required

    config = ConfigParser()
    if os.path.exists(configpath):
        config.read(configpath)

    yml_obj = orthauth_path_secrets_min_template.copy()

    yml_obj["pennsieve"][sparc_organization_id]["key"] = config[ps_account]["api_token"]
    yml_obj["pennsieve"][sparc_organization_id]["secret"] = config[ps_account]["api_secret"]

    # delete pre-existing file
    if os.path.exists(orthauth_path_secrets):
        os.remove(orthauth_path_secrets)

    # write yaml object to the secrets file.
    with open(orthauth_path_secrets, 'w') as file:
        yaml.dump(yml_obj, file)

    os.chmod(orthauth_path_secrets, 0o0600) # required for the validator

    return "Valid"

# Check that all the keys are accounted for
def check_prerequisites(ps_account):
    ## pyontutils config
    if not os.path.exists(pyontutils_path):
        pyontutils_path.mkdir(parents = True, exist_ok = True)

    with open(pyontutils_path_config, 'w') as file:
        yaml.dump(pyontutils_config, file)
    
    # orthauth config folder path
    if not os.path.exists(orthauth_path):
        orthauth_path.mkdir(parents = True, exist_ok = True)

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
    # return
    # global local_dataset_folder_path
    # global validation_json

    check_prerequisites(ps_account)

    sparc_dataset_id = ps_dataset
    sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    try:
        organization = PennsieveId(sparc_organization_id)
        sparc_dataset = PennsieveId(sparc_dataset_id)
    except Exception as e:
        raise e

    # create dataset folder for the retrieve
    if not os.path.exists(parent_folder):
        parent_folder.mkdir(parents = True, exist_ok = True)

    local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    

    # def temp_retrieve_function(sparc_dataset, organization, parent_folder):
    #     global local_dataset_folder_path
    #     gevent.sleep(0)
    #     local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #     gevent.sleep(0)
    
    # gev = []
    # try:
    #     # retrieve the dataset from Pennsive. --check for heartbeat errors here
    #     if organization != "" and sparc_dataset != "":
    #         gevent.sleep(0)
    #         gev.append(gevent.spawn(temp_retrieve_function, sparc_dataset, organization, parent_folder))
    #         gevent.sleep(0)
    #         gevent.joinall(gev) 
    #         gevent.sleep(0)
    #         try:
    #             gev[0].get()
    #         except Exception as e:
    #             raise e
    #     else:
    #         raise Exception("Retrieve Errror")
    # except Exception as e:
    #     raise e

    validation_json = {}
    validation_json = validate(local_dataset_folder_path)


    # def temp_validate_function(local_dataset_folder_path):
    #     global validation_json
    #     gevent.sleep(0)
    #     validation_json = validate(local_dataset_folder_path)
    #     gevent.sleep(0)

    # local_dataset_folder_path = r"/home/dev/files/sparc-datasets/2f4afec4-6e4d-4c20-b913-8e115fc8631b/Acute effects of gastric electrical stimulation (GES) settings on neural activity accessed with functional magnetic resonance maging (fMRI) in rats"

    # try:
    #     gevent.sleep(0)
    #     gev.append(gevent.spawn(temp_validate_function, local_dataset_folder_path))
    #     gevent.sleep(0)
    #     gevent.joinall(gev) 
    #     gevent.sleep(0)
    #     try:
    #         gev[0].get()
    #     except Exception as e:
    #         raise e
    # except Exception as e:
    #     raise e

    try:
        path_error_report = validation_json["status"]["path_error_report"]
    except Exception as e:
        path_error_report = validation_json["status"]

    # path_error_report = validation_json["status"]["path_error_report"]
    # path_error_report = {}
    # blob = json.dumps(validation_json, indent=4, sort_keys=True, default=str)

    # Delete the local dataset. 
    # FUTURE: Look into setting an expiration date for this one.
    dir_path = SparCurPath(local_sparc_dataset_location + '/' + sparc_dataset_uuid).expanduser()
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        # no folder present
        print("Error: %s : %s" % (dir_path, e.strerror))

    # return the error report. We can deal with the validation on the front end.
    return path_error_report

def create_local_dataset(soda_json_obj):
    
    def get_relative_path(bfpath):
        current_folder_path = sodavalidatorpath
        for relative_path in bfpath:
            current_folder_path = join(current_folder_path, relative_path)
        return current_folder_path
    
    def recursive_folder_file_create(dataset_folder):
        if "folders" in dataset_folder:
            for folder in dataset_folder["folders"]:
                if "bfpath" in dataset_folder["folders"][folder]:
                    current_folder_path = get_relative_path(dataset_folder["folders"][folder]["bfpath"])
                    if not os.path.exists(current_folder_path):
                        Path(current_folder_path).mkdir(parents = True, exist_ok = True)
                    recursive_folder_file_create(dataset_folder["folders"][folder])

        if "files" in dataset_folder:
            for file in dataset_folder["files"]:
                if "bfpath" in dataset_folder["files"][file]:
                    current_folder_path = get_relative_path(dataset_folder["files"][file]["bfpath"])
                    current_file_path = join(current_folder_path, file)
                    if "url" in dataset_folder["files"][file]:
                        url = dataset_folder["files"][file]["url"]
                        new_file = open(current_file_path, 'wb')
                        if url != "":
                            req = requests.get(url)
                            url_content = req.content
                            new_file.write(url_content)
                        else:
                            new_file.write("Mock file generated by SODA".encode())
                        new_file.close()
                        temp_time = dateutil.parser.parse(dataset_folder["files"][file]["timestamp"])
                        temp_time = temp_time.timestamp()
                        os.utime(current_file_path, (temp_time, temp_time))
                    else:
                        raise Exception
                    
    def metadata_file_create(metadata_files):
        for file in metadata_files:
            current_folder_path = get_relative_path([])
            current_file_path = join(current_folder_path, file)
            if "url" in metadata_files[file]:
                url = metadata_files[file]["url"]
                new_file = open(current_file_path, 'wb')
                if url != "":
                    req = requests.get(url)
                    url_content = req.content
                    new_file.write(url_content)
                else:
                    new_file.write("Mock file generated by SODA".encode())
                new_file.close()
                temp_time = dateutil.parser.parse(metadata_files["files"][file]["timestamp"])
                temp_time = temp_time.timestamp()
                os.utime(current_file_path, (temp_time, temp_time))
            else:
                raise Exception
    
    dir_path = Path(sodavalidatorpath)
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        # no folder present
        print("Error: %s : %s" % (dir_path, e.strerror))
    
    if not os.path.exists(sodavalidatorpath):
        Path(sodavalidatorpath).mkdir(parents = True, exist_ok = True)
    
    if "dataset-structure" in soda_json_obj:
        try:
            recursive_folder_file_create(soda_json_obj["dataset-structure"])
        except e:
            raise e
            
    if "metadata-files" in soda_json_obj:
        try:
            metadata_file_create(soda_json_obj["metadata-files"])
        except e:
            raise e
    else:
        raise Exception("Empty dataset")

def ps_retrieve_dataset(soda_json_structure):
    """
    Function for importing Pennsieve data files info into the "dataset-structure" key of the soda json structure,
    including metadata from any existing manifest files in the high-level folders
    (name, id, timestamp, description, additional metadata)

    Args:
        soda_json_structure: soda structure with bf account and dataset info available
    Output:
        same soda structure with Pennsieve data file info included under the "dataset-structure" key
    """

    double_extensions = ['.ome.tiff','.ome.tif','.ome.tf2,','.ome.tf8','.ome.btf','.ome.xml','.brukertiff.gz','.mefd.gz','.moberg.gz','.nii.gz','.mgh.gz','.tar.gz','.bcl.gz']
    
    download_extensions = [".xlsx", ".csv", ".xlsm", ".xlsb", ".xltx", ".xltm", ".xls", ".xlt", ".xls", ".xml", ".xlam", ".xla", ".xlw", ".xlr", ".json", ".txt"]
    #f = open("dataset_contents.soda", "a")

    def verify_file_name(file_name, extension):
        if extension == "":
            return (file_name, extension)
        
        double_ext = False
        for ext in double_extensions:
            if file_name.find(ext) != -1:
                double_ext = True
                break
            
        extension_from_name = ""

        if double_ext == False:
            extension_from_name = os.path.splitext(file_name)[1]
        else:
            extension_from_name = os.path.splitext(os.path.splitext(file_name)[0])[1] + os.path.splitext(file_name)[1]
        
        if extension_from_name == ('.' + extension):
            return (file_name, extension_from_name)
        else:
            return (file_name + ('.' + extension), ('.' + extension))

    # Add a new key containing the path to all the files and folders on the
    # local data structure..
    def recursive_item_path_create(folder, path):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "bfpath" not in folder["files"][item]:
                    folder["files"][item]['bfpath'] = path[:]

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                if "bfpath" not in folder["folders"][item]:
                    folder["folders"][item]['bfpath'] = path[:]
                    folder["folders"][item]['bfpath'].append(item)
                recursive_item_path_create(folder["folders"][item], folder["folders"][item]['bfpath'][:])
        return

    level = 0

    def recursive_dataset_import(my_item, metadata_files, dataset_folder, my_level):
        level = 0
        col_count = 0
        file_count = 0

        for item in my_item:
            if item.type == "Collection":
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                    
                col_count += 1
                folder_name = item.name
                
                if col_count == 1:
                    level = my_level + 1
                dataset_folder["folders"][folder_name] = {
                    "type": "bf", "action": ["existing"], "path": item.id}
                sub_folder = dataset_folder["folders"][folder_name]
                
                if "folders" not in sub_folder:
                    sub_folder["folders"] = {}
                if "files" not in sub_folder:
                    sub_folder["files"] = {}
                    
                recursive_dataset_import(item,metadata_files, sub_folder, level)
            else:
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                    
                package_id = item.id
                package_details = bf._api._get(
                    '/packages/' + str(package_id))
                
                if ("extension" not in package_details):
                    (file_name, ext) = verify_file_name(package_details["content"]["name"], "")
                else:
                    (file_name, ext) = verify_file_name(package_details["content"]["name"], package_details["extension"])

                if my_level == 0:
                    if ext in download_extensions:
                        file_details = bf._api._get('/packages/' + str(package_id) + '/view')
                        print(file_details)
                        file_id = file_details[0]["content"]["id"]
                        file_url = bf._api._get(
                            '/packages/' + str(package_id) + '/files/' + str(file_id))
                        timestamp = (package_details["content"]["updatedAt"])
                        metadata_files[file_name] = {
                            "type": "bf", 
                            "action": ["existing"], 
                            "path": item.id, 
                            "timestamp": timestamp, 
                            "extension": ext, 
                            "url": file_url["url"],  
                            "size": file_details[0]["content"]["size"]
                        }
                    else:
                        timestamp = (package_details["content"]["updatedAt"])
                        metadata_files[file_name] = {
                            "type": "bf", "action": ["existing"], "path": item.id, "timestamp": timestamp, "extension": ext, "url": "", "size": 1}
                else:
                    file_count += 1
                    if ext in download_extensions:
                        file_details = bf._api._get('/packages/' + str(package_id) + '/view')
                        file_id = file_details[0]["content"]["id"]
                        file_url = bf._api._get(
                            '/packages/' + str(package_id) + '/files/' + str(file_id))
                        timestamp = (package_details["content"]["updatedAt"])
                        dataset_folder["files"][file_name] = {
                            "type": "bf","action": ["existing"], 
                            "path": item.id, 
                            "timestamp": timestamp, 
                            "extension": ext, 
                            "url": file_url["url"], 
                            "size": file_details[0]["content"]["size"]
                        }
                    else:
                        timestamp = (package_details["content"]["updatedAt"])
                        dataset_folder["files"][file_name] = {
                            "type": "bf","action": ["existing"], "path": item.id, "timestamp": timestamp, "extension": ext, "url": "", "size": 1}

    error = []

    # check that the Pennsieve account is valid
    try:
        bf_account_name = soda_json_structure["bf-account-selected"]["account-name"]
    except Exception as e:
        raise e

    try:
        bf = Pennsieve(bf_account_name)
    except Exception as e:
        error.append('Error: Please select a valid Pennsieve account')
        raise Exception(error)

    # check that the Pennsieve dataset is valid
    try:
        bf_dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    except Exception as e:
        raise e
    try:
        myds = bf.get_dataset(bf_dataset_name)
    except Exception as e:
        error.append('Error: Please select a valid Pennsieve dataset')
        raise Exception(error)

    # check that the user has permission to edit this dataset
    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ['owner', 'manager']:
            curatestatus = 'Done'
            error.append("Error: You don't have permissions for uploading to this Pennsieve dataset")
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        # import files and folders in the soda json structure
        soda_json_structure["dataset-structure"] = {}
        soda_json_structure["metadata-files"] = {}
        dataset_folder = soda_json_structure["dataset-structure"]
        metadata_files = soda_json_structure["metadata-files"]
        recursive_dataset_import(myds, metadata_files, dataset_folder, level)

        #remove metadata files keys if empty
        metadata_files = soda_json_structure["metadata-files"]
        if not metadata_files:
            del soda_json_structure['metadata-files']

        dataset_folder = soda_json_structure["dataset-structure"]

        recursive_item_path_create(soda_json_structure["dataset-structure"], [])
        success_message = "Data files under a valid high-level SPARC folders have been imported"

        create_local_dataset(soda_json_structure)

    except Exception as e:
        raise e
    # global local_dataset_folder_path
    # global validation_json

    # check_prerequisites(ps_account)

    # sparc_dataset_id = ps_dataset
    # sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    # try:
    #     organization = PennsieveId(sparc_organization_id)
    #     sparc_dataset = PennsieveId(sparc_dataset_id)
    # except Exception as e:
    #     raise e

    # # create dataset folder for the retrieve
    # if not os.path.exists(parent_folder):
    #     parent_folder.mkdir(parents = True, exist_ok = True)

    # def temp_retrieve_function(sparc_dataset, organization, parent_folder):
    #     global local_dataset_folder_path
    #     local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #     return
    
    # gev = []
    # try:
    #     # retrieve the dataset from Pennsive. --check for heartbeat errors here
    #     if organization != "" and sparc_dataset != "":
    #         gevent.sleep(0)
    #         # gev.append(gevent.spawn(temp_retrieve_function, sparc_dataset, organization, parent_folder))
    #         local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #         # gevent.sleep(0)
    #         # gevent.joinall(gev) 
    #         # gevent.sleep(0)
    #         # try:
    #         #     gev[0].get()
    #         # except Exception as e:
    #         #     raise e
    #     else:
    #         raise Exception("Retrieve Errror")

    #     return str(local_dataset_folder_path)
    # except Exception as e:
    #     raise e



def val_dataset_pipeline(ps_account, ps_dataset):
    global local_dataset_folder_path
    global validation_json

    # sparc_dataset_id = ps_dataset
    # sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    validation_json = {}
    def temp_validate_function(local_dataset_folder):
        global validation_json
        validation_json = validate(local_dataset_folder)

    # local_dataset_folder_path = r"/home/dev/files/sparc-datasets/2f4afec4-6e4d-4c20-b913-8e115fc8631b/Acute effects of gastric electrical stimulation (GES) settings on neural activity accessed with functional magnetic resonance maging (fMRI) in rats"
    gev = []
    try:
        gevent.sleep(0)
        gev.append(gevent.spawn(temp_validate_function, Path(sodavalidatorpath)))
        # validation_json = validate(local_dataset_folder_path)
        gevent.sleep(0)
        gevent.joinall(gev) 
        # gevent.sleep(0)
        try:
            gev[0].get()
        except Exception as e:
            raise e
    except Exception as e:
        raise e

    try:
        path_error_report = validation_json["status"]["path_error_report"]
    except Exception as e:
        path_error_report = validation_json["status"]
    # path_error_report = {}
    # blob = json.dumps(validation_json, indent=4, sort_keys=True, default=str)

    # Delete the local dataset. 
    # FUTURE: Look into setting an expiration date for this one.
    # dir_path = SparCurPath(local_sparc_dataset_location + '/' + sparc_dataset_uuid).expanduser()
    # try:
    #     shutil.rmtree(dir_path)
    # except OSError as e:
    #     # no folder present
    #     print("Error: %s : %s" % (dir_path, e.strerror))

    # return the error report. We can deal with the validation on the front end.
    return path_error_report
