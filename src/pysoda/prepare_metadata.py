# -*- coding: utf-8 -*-

### Import required python modules

from gevent import monkey; monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname, getsize, abspath
import pandas as pd
import time
from time import strftime, localtime
import shutil
from shutil import copy2
from configparser import ConfigParser
import numpy as np
from collections import defaultdict
import subprocess
from websocket import create_connection
import socket
import errno
import re
import gevent
from pennsieve import Pennsieve
from pennsieve.log import get_logger
from pennsieve.api.agent import agent_cmd
from pennsieve.api.agent import AgentError, check_port, socket_address
from urllib.request import urlopen
import json
import collections
from threading import Thread
import pathlib

from string import ascii_uppercase
import itertools

from openpyxl import load_workbook
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font
from openpyxl.styles.colors import Color
from docx import Document

from datetime import datetime, timezone

userpath = expanduser("~")
metadatapath = join(userpath, 'SODA', 'SODA_metadata')
DEV_TEMPLATE_PATH = join(dirname(__file__), "..", "file_templates")
# once pysoda has been packaged with pyinstaller
# it becomes nested into the pysodadist/api directory
PROD_TEMPLATE_PATH = join(dirname(__file__), "..", "..", "file_templates")
TEMPLATE_PATH = DEV_TEMPLATE_PATH if exists(DEV_TEMPLATE_PATH) else PROD_TEMPLATE_PATH

class InvalidDeliverablesDocument(Exception):
    pass

### Import Milestone document
def import_milestone(filepath):
    doc = Document(filepath)
    try:
        table = doc.tables[0]
    except IndexError:
        raise InvalidDeliverablesDocument("Please select a valid SPARC Deliverables Document! The following headers could not be found in a table of the document you selected: 'Related milestone, aim, or task', 'Description of data', and 'Expected date of completion'.")
    data = []
    keys = None
    for i, row in enumerate(table.rows):
        text = (cell.text for cell in row.cells)
        # headers will become the keys of our dictionary
        if i == 0:
            keys = tuple(text)
            continue
        # Construct a dictionary for this row, mapping
        # keys to values for this row
        row_data = dict(zip(keys, text))
        data.append(row_data)
    return data

def extract_milestone_info(datalist):
    milestone = defaultdict(list)
    milestone_key1 = "Related milestone, aim, or task"
    milestone_key2 = "Related milestone, aim or task"
    other_keys = ["Description of data", "Expected date of completion"]
    for row in datalist:
        if milestone_key1 in row:
            milestone_key = milestone_key1
        elif milestone_key2 in row:
            milestone_key = milestone_key2
        else:
            raise InvalidDeliverablesDocument("Please select a valid SPARC Deliverables Document! The following headers could not be found in a table of the document you selected: Related milestone, aim, or task, Description of data, and Expected date of completion.")

        key = row[milestone_key]
        if key != "":
            milestone[key].append({key: row[key] for key in other_keys})

    return milestone

### Prepare submission file
def save_submission_file(filepath, json_str):
    source = join(TEMPLATE_PATH, "submission.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    # json array to python list
    val_arr = json.loads(json_str)
    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']
    # date_obj = datetime.strptime(val_arr[2], "%Y-%m")
    # date_new = date_obj.strftime("%m-%Y")
    for column, arr in zip(excel_columns(start_index=2), val_arr):
        ws1[column+"2"] = arr['award']
        ws1[column+"3"] = arr['milestone']
        ws1[column+"4"] = arr['date']

    rename_headers(ws1, len(val_arr), 2)

    wb.save(destination)

def excel_columns(start_index=0):
    """
    NOTE: does not support more than 699 contributors/links
    """
    single_letter = list(ascii_uppercase[start_index:])
    two_letter = [a + b for a,b in itertools.product(ascii_uppercase, ascii_uppercase)]
    return single_letter + two_letter

def rename_headers(workbook, max_len, start_index):
    """
    Rename header columns if values exceed 3. Change Additional Values to Value 4, 5,...
    """

    columns_list = excel_columns(start_index=start_index)
    if max_len >= start_index:

        workbook[columns_list[0] + "1"] = "Value"

        for i, column in zip(range(2, max_len+1), columns_list[1:]):

            workbook[column + "1"] = "Value " + str(i)
            cell = workbook[column + "1"]

            blueFill = PatternFill(start_color='9CC2E5',
                               end_color='9CC2E5',
                               fill_type='solid')

            font = Font(bold=True)
            cell.fill = blueFill
            cell.font = font

    else:

        delete_range = len(columns_list) - max_len - 1
        workbook.delete_cols(4+max_len, delete_range)


### Prepare dataset-description file

def populate_dataset_info(workbook, val_array):
    ## name, description, samples, subjects
    workbook["D2"] = val_array[0]
    workbook["D3"] = val_array[1]
    workbook["D17"] = val_array[3]
    workbook["D16"] = val_array[4]

    ## keywords
    for i, column in zip(range(len(val_array[2])), excel_columns(start_index=3)):
        workbook[column + "4"] = val_array[2][i]

    return val_array[2]

def populate_contributor_info(workbook, val_array):
    ## award info
    for i, column in zip(range(len(val_array["funding"])), excel_columns(start_index=3)):
        workbook[column + "11"] = val_array["funding"][i]

    ### Acknowledgments
    workbook["D10"] = val_array["acknowledgment"]

    ### Contributors
    for contributor, column in zip(val_array['contributors'], excel_columns(start_index=3)):
        workbook[column + "5"] = contributor["conName"]
        workbook[column + "6"] = contributor["conID"]
        workbook[column + "7"] = contributor["conAffliation"]
        workbook[column + "9"] = contributor["conContact"]
        workbook[column + "8"] = contributor["conRole"]

    return [val_array["funding"], val_array['contributors']]

def populate_links_info(workbook, val_array):
    ## originating DOI, Protocol DOI
    total_link_array = val_array["Originating Article DOI"] + val_array["Protocol URL or DOI*"] + val_array["Additional Link"]
    for i, column in zip(range(len(total_link_array)), excel_columns(start_index=3)):
        if total_link_array[i]["link type"] == "Originating Article DOI":
            workbook[column + "12"] = total_link_array[i]["link"]
            workbook[column + "13"] = ""
            workbook[column + "14"] = ""
            workbook[column + "15"] = total_link_array[i]["description"]
        if total_link_array[i]["link type"] == "Protocol URL or DOI*":
            workbook[column + "12"] = ""
            workbook[column + "13"] = total_link_array[i]["link"]
            workbook[column + "14"] = ""
            workbook[column + "15"] = total_link_array[i]["description"]
        if total_link_array[i]["link type"] == "Additional Link":
            workbook[column + "12"] = ""
            workbook[column + "13"] = ""
            workbook[column + "14"] = total_link_array[i]["link"]
            workbook[column + "15"] = total_link_array[i]["description"]

    return total_link_array

def populate_completeness_info(workbook, val_array, bfaccountname):
    ## completeness, parent dataset ID, title Respectively
    workbook["D18"] = val_array["completeness"]
    workbook["D20"] = val_array["completeDSTitle"]

    ## parent Datasets
    parentds_id_array = []
    try:
        bf = Pennsieve(bfaccountname)

        for dataset in val_array["parentDS"]:

            myds = bf.get_dataset(dataset)
            dataset_id = myds.id
            parentds_id_array.append(dataset_id)

            workbook["D19"] = ", ".join(parentds_id_array)

    except Exception as err:
        # NOTE: Pennsieve package 3.2.0 misspells 'invalid'
        if 'Invalid profile name' in str(err) or "Invaid profile name" in str(err):
            raise Exception("Please connect SODA with Pennsieve to use this feature!")
        raise

### generate the file
def save_ds_description_file(bfaccountname, filepath, dataset_str, misc_str, optional_str, con_str):
    source = join(TEMPLATE_PATH, "dataset_description.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    # json array to python list
    val_arr_ds = json.loads(dataset_str)
    val_arr_con = json.loads(con_str)
    val_arr_misc = json.loads(misc_str)
    val_arr_optional = json.loads(optional_str)

    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']

    keyword_array = populate_dataset_info(ws1, val_arr_ds)
    (funding_array, contributor_role_array) = populate_contributor_info(ws1, val_arr_con)
    total_link_array = populate_links_info(ws1, val_arr_misc)
    populate_completeness_info(ws1, val_arr_optional, bfaccountname)

    # keywords
    keyword_len = len(keyword_array)

    # contributors
    no_contributors = len(contributor_role_array)

    # funding = SPARC award + other funding sources
    funding_len = len(funding_array)

    # total links added
    link_len = len(total_link_array)

    max_len = max(keyword_len, funding_len, link_len, no_contributors)

    rename_headers(ws1, max_len, 3)

    wb.save(destination)

def save_subjects_file(filepath, datastructure):

    source = join(TEMPLATE_PATH, "subjects.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    wb = load_workbook(destination)
    ws1 = wb['Sheet1']

    # 1. delete rows using delete_rows(index, amount=2) -- description and example rows
    ws1.delete_rows(2, 2)

    # 2. see if the length of datastructure[0] == length of datastructure. If yes, go ahead. If no, add new columns from headers[n-1] onward.
    headers_no = len(datastructure[0])
    orangeFill = PatternFill(start_color='FFD965',
                       end_color='FFD965',
                       fill_type='solid')

    for column, header in zip(excel_columns(start_index=18), datastructure[0][18:]):
        cell = column + str(1)
        ws1[cell] = header
        ws1[cell].fill = orangeFill
        ws1[cell].font = Font(bold=True, size=12, name='Calibri')

    # 3. populate matrices
    for i, item in enumerate(datastructure):
        if i == 0:
            continue
        for column, j in zip(excel_columns(start_index=0), range(len(item))):
            cell = column + str(i + 1)
            if datastructure[i][j]:
                ws1[cell] = datastructure[i][j]
            else:
                ws1[cell] = ""
                
            ws1[cell].font = Font(bold=False, size=11, name='Arial')

    # 4. delete empty columns
    # deletedCols = []
    # # For row in range(datastructure): if row[cell].value !== None, break. If all None, delete entire column
    # for col_cells in ws1.iter_cols(min_col=4, max_col=len(datastructure[0]), min_row=2, max_row=len(datastructure)):
    #     flag = False
    #     for cell in col_cells:
    #         if cell is None:
    #             flag = True
    #             continue
    #         else:
    #             break
    #         deletedCols.append(cell.col_idx)

    # deletedColumnNumber = 0
    # for ind, col in enumerate(deletedCols):
    #     if ind == 0:
    #         ws1.delete_cols(col)
    #     else:
    #         col = col - deletedColumnNumber
    #         ws1.delete_cols(col)
    #     deletedColumnNumber += 1
    #
    wb.save(destination)

def save_samples_file(filepath, datastructure):
    source = join(TEMPLATE_PATH, "samples.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    wb = load_workbook(destination)
    ws1 = wb['Sheet1']

    # 1. delete rows using delete_rows(index, amount=2) -- description and example rows
    ws1.delete_rows(2, 2)

    # 2. see if the length of datastructure[0] == length of datastructure. If yes, go ahead. If no, add new columns from headers[n-1] onward.
    headers_no = len(datastructure[0])
    orangeFill = PatternFill(start_color='FFD965',
                       end_color='FFD965',
                       fill_type='solid')
    if headers_no > 22:
        for column, header in zip(excel_columns(start_index=22), datastructure[0][22:]):
            cell = column + str(1)
            ws1[cell] = header
            ws1[cell].fill = orangeFill
            ws1[cell].font = Font(bold=True, size=12, name='Calibri')

    # 3. populate matrices
    for i, item in enumerate(datastructure):
        if i == 0:
            continue
        for column, j in zip(excel_columns(start_index=0), range(len(item))):
            cell = column + str(i + 1)
            ws1[cell] = datastructure[i][j]
            ws1[cell].font = Font(bold=False, size=11, name='Arial')

    wb.save(destination)

def column_check(x):
    if 'unnamed' in x.lower():
        return False
    return True

subjectsTemplateHeaderList = ["subject_id", "pool_id", "experimental group", "age", "sex", "species", "strain", "rrid for strain", "additional fields (e.g. minds)", "age category", "age range (min)", "age range (max)", "handedness", "genotype", "reference atlas", "protocol title", "protocol.io location", "experimental log file name"]
samplesTemplateHeaderList = ["subject_id", "sample_id", "wasderivedfromsample", "pool_id", "experimental group", "specimen type", "specimen anatomical location", "additional fields (e.g. minds)", "species", "sex", "age", "age category", "age range (min)", "age range (max)", "handedness", "strain", "rrid for strain",  "genotype", "reference atlas", "protocol title", "protocol.io location", "experimental log file name"]

def convert_subjects_samples_file_to_df(type, filepath):
    if type == "subjects":
        templateHeaderList = subjectsTemplateHeaderList
    else:
        templateHeaderList = samplesTemplateHeaderList

    subjects_df = pd.read_excel(filepath, engine='openpyxl', usecols=column_check, header=0)
    subjects_df = subjects_df.dropna(axis = 0, how = 'all')
    subjects_df = subjects_df.applymap(str)
    subjects_df.columns = map(str.lower, subjects_df.columns)
    importedHeaderList = list(subjects_df.columns.values)

    transpose = []
    for header in templateHeaderList:
        column = [header]
        try:
            column.extend(subjects_df[header].values.tolist())
        except KeyError:
            column.extend([""]*len(subjects_df))
        transpose.append(column)

    for header in importedHeaderList:
        if header.lower() in templateHeaderList:
            continue
        column = [header]
        try:
            column.extend(subjects_df[header].values.tolist())
        except KeyError:
            column.extend([""]*len(subjects_df))
        transpose.append(column)

    return transposeMatrix(transpose)

def transposeMatrix(matrix):
    return [[matrix[j][i] for j in range(len(matrix))] for i in range(len(matrix[0]))]
