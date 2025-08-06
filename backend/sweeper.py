"""

sweeper.py

Handles file retrieval from a user-specified path , file scanning , filtering , archiving, and deletion based on file type, size, and last modified time.

"""

import json # Used to handle JSON files
import time # Used to handle Timestamp operations
import logging # Used for data and operation logging
from datetime import datetime #Used to retrieve current timestamp
from pathlib import Path #Used to handle file paths
from send2trash import send2trash #Used to delete files

summary_file = "summary_file.json" #JSON file to store file summary data

def get_folder_path(user_input):
    
    """
    Gets the user-provoided folder path that the files will be cleaned from
     
    Args:
        user_input (str): The folder path input by the user.

    Returns:
        user_path: Absolute path to the target folder
    """

    #If user input is blank then default the path to downloads 

    if user_input == "":
        user_path = Path.home() / "Downloads"

    else:     
        user_path = Path(user_input)  #Convert the input to a path object so it can be used
        if not user_path.is_absolute(): 
            user_path = Path.home() / user_path #Set path into user-provoided path
    
    return user_path            

def get_files(user_path, file_type):
    
    """
    Gets all the files from the user-provoided path

    Args:
        user_path (Path): The path to search for files
        file_type (str): The type of files to be cleaned 

    Returns:
            file_objects(List): List of file paths   
    """

    #If file_type blank then get all file types

    if file_type == "":
        files = list(user_path.rglob("*"))

    else:
        file_type = file_type.lstrip('*')  # Remove any leading dot from the file_type
        extension = f"*.{file_type}"  
        files = list(user_path.rglob(extension)) #Get only the file type that the user provoided

    file_objects = [f for f in files if f.is_file()] #Returns only actual files and not directories
    
    return file_objects



def return_filtered_files(files, time_limit, size_filter):

    """
    Gets all the files after filters are added based on size and last modified times

    Args:
        files (List): List of file paths
        time_limit (int): How long a file must not be modified in order for it to be eligible for deletion
        size_filter (int): Maximum file size that can be deleted

    Returns:
            filtered_files: Remaining files after filters are added
    """

    filtered_files = []
    for f in files:
        if not f.is_file(): #If not a file skip
            continue

        if "Archive_Junk" in str(f): #If the file is in the archive folder skip
            continue

        if f.name == "deleted_files.log": #If the file is a log file skip
            continue

        file_size = f.stat().st_size #Size of the file
        file_mtime = f.stat().st_mtime #Last modified time of the file

        if file_size < size_filter and file_mtime < time_limit:
            filtered_files.append(f)

    return filtered_files     

def send_archive_folder(user_path,filtered_files):
    
    """
    Sends the files to an archive folder so the user can check

    Args:
        user_path (Path):
        filtered_files () : Remaining files after filters are added

    Returns:
            archived_files: List of archived files
    """   

    archive_folder = user_path / "Archive_Junk" #Set the archive folder
    archived_files = []
    archive_folder.mkdir(exist_ok = True) #Create a new folder at the location saved in the archive_folder variable

    for f in filtered_files:
        destination_path = archive_folder / f.name #Add the file to the archive folder

        counter = 1
        while destination_path.exists():
            name_parts = f.name.rsplit('.',1) #Splits the filename into the name and extension
            if len(name_parts) == 2:
                new_name = f"{name_parts[0]}_{counter}.{name_parts[1]}" #Adds _1 , _2 before the file extension for duplicate files
            else:
                new_name = f"{f.name}_{counter}" #If the file has no extension , add the counter
            destination_path = archive_folder / new_name   
            counter += 1

        try:
            #Moves file to the archive folder
            f.replace(destination_path)
            archived_files.append(destination_path)   
        except Exception as e:
            print(f"Error archiving {f.name} : {e}")

    return archived_files

def archive_file_logging(filtered_files, operation, logger):

    
    """
    Logs file inforamtion from archived files

    Args:
        
        filtered_files: Remaining files after filters are added
        operation (str): Operation name
        logger (Logger): Logger instance for recording

    """
    #Collects file information

    for f in filtered_files:
        file_name = f.name
        file_size = f.stat().st_size
        file_time = datetime.now()
        logger.info(f"File name: {file_name} | Size: {file_size} bytes | {operation} at: {file_time}") #Write log entry

def deleted_file_logging(deleted_logs, operation, logger):

    """
    Logs file inforamtion from deleted files

    Args:
        
        deleted_logs(List[Dict]): Data of deleted files
        operation (str): Operation name
        logger (Logger): Logger instance for recording
    """

    for f in deleted_logs:
        logger.info(f"File name: {f['Name']}) | Size: {f['Size']} bytes | {operation} at: {f['Time']}") #Write log entry

def clean_files(user_input, file_type="",days_unused=30,size_limit_kb=100000,archive=False):
    
    """
    Cleans files by either deleting them or archiving them

    Args:
        user_input (str): Folder path from user input
        file_type (str): Type of file
        days_unused(int): Number of days a file hasnt been modified
        size_limit_kb(int) : Maximum file size in KB
        archive (bool): Either will archive or delete

    Returns:
            Dictionary containing status count and path of the operation
    """

    file_count = []
    file_size = []

    user_path = get_folder_path(user_input)

    log_file_path = str(user_path / "deleted_files.log") #Creates a log file inside the folder

    file_logger = logging.getLogger('file_operations') #Creates a logger 
    file_logger.setLevel(logging.INFO)

    if file_logger.handlers:
        file_logger.handlers.clear() #Removes any existing handlers

    file_handler = logging.FileHandler(log_file_path, mode='a') #Create a file handler that writes logs to the log file
    file_handler.setLevel(logging.INFO)  

    formatter = logging.Formatter('%(asctime)s-%(message)s') #Formats log files
    file_handler.setFormatter(formatter)

    file_logger.addHandler(file_handler)

    file_logger.propagate = False #Prevents server logs from appearing
    
    files = get_files(user_path, file_type)

    time_filter = int(days_unused) * 86400 #Converted to seconds
    size_filter = int(size_limit_kb) * 1000 #Converted to bytes
    time_limit = time.time() - time_filter #Cutoff timestamp

    filtered_files = return_filtered_files(files,time_limit,size_filter)
    
    if archive:
        for f in filtered_files:
            file_count.append(f)
            file_size.append(f.stat().st_size)

        update_total_cleaned(file_size,file_count)    

        archived_files = send_archive_folder(user_path, filtered_files)
        archive_file_logging(archived_files, "Archived", file_logger)
        return {"status": "archived", "count": len(archived_files), "path": str(user_path)}
    
    else:
        deleted_logs = []
        successfully_deleted = 0
        
        for f in filtered_files:
            try:
                file_info ={
                    "Name": f.name,
                    "Size": f.stat().st_size,
                    "Time": datetime.now()
                }

                file_count.append(f)
                file_size.append(f.stat().st_size)

                send2trash(str(f))
                deleted_logs.append(file_info)
                successfully_deleted += 1
            
            except Exception as e:
                print(f"Error deleteing {f.name}:{e}")

                if f in file_count:
                    index=file_count.index(f)
                    file_count.pop(index)
                    file_size.pop(index)
        
        if successfully_deleted > 0:
            update_total_cleaned(file_size,file_count)
            deleted_file_logging(deleted_logs,"Deleted",file_logger)  
        return {"status": "deleted", "count": successfully_deleted , "path": str(user_path)}
    
def update_total_cleaned(file_size,files_count):

    """
    Updates the summary file with the total size and number of cleaned files

    Args:
        
        file_size(List[int]): List of file sizes
        (List[Path]): List of cleaned files
    """

    data={}

    try:
        with open(summary_file,"r") as f:
            data = json.load(f)
    
    except FileNotFoundError:
        pass

    data["total_size"] = data.get("total_size",0) + sum(file_size) 
    data["total_files"] = data.get("total_files",0) + len(files_count)

    with open(summary_file, "w") as f:
        json.dump(data,f)       
        
                 
                                    
    


        
















    





