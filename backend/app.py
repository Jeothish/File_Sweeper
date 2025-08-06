from flask import Flask , request, jsonify #Flask framework which creates the web API
from flask_cors import CORS #Used to enable Cross-Origin Resource Sharing for frontend access
import time #Used for time calcultions
from pathlib import Path #Used to handle file paths
from sweeper import clean_files , get_files , return_filtered_files #Import required functions from sweeper.py
import json #For reading/writing JSON files

app = Flask(__name__) #Creates Flask app
CORS(app) #Allows frontend to communicate with backend

def get_folder_path(user_input):
    
    """
    Gets the user-provoided path

    Args:
        user_input(str): User-provoided folder path.


    Returns:
            Path: Absolute path to the target folder    
    """

    if user_input == "":
        user_path = Path.home() / "Downloads"

    else:     
        user_path = Path(user_input)  #Convert the input to a path object so it can be used
        if not user_path.is_absolute(): 
            user_path = Path.home() / user_path #Set path into user-provoided path
    
    return user_path   

@app.route('/clean', methods=['POST']) #Flask route that accepts POST requests
def clean():
    
    """
    Cleans files based on user-inputted criteria

    Expects JSON:
    {
        "user_path": "...",
        "file_type": "...",
        "days_unused": "30",
        "size_limit_kb": "100000",
        "archive": "true/false"
    }

    Returns:
        JSON: Cleanup result and status
    """

    data=request.json
    #Calls clean_files function with paramters gotten from data
    try:
        result = clean_files(
            user_input=data.get('user_path',''),
            file_type=data.get('file_type',''),
            days_unused=data.get('days_unused',30),
            size_limit_kb=data.get('size_limit_kb',100000),
            archive=data.get('archive',False)
        )
        return jsonify(result) #Converts dictionary from clean_files into JSON to be sent back as the response
    except Exception as e:
        return jsonify({"error":str(e), "status":"error"}), 500
    
@app.route('/preview', methods=['POST']) 
def preview_files():

    """
    Previews files that would be deleted based on user-inputted criteria

    Expects JSON:
    {
        "user_path": "...",
        "file_type": "...",
        "days_unused": "30",
        "size_limit_kb": "100000",
        
    }

    Returns:
        JSON: List of files that meet the criteria
    """

    data = request.json

    try:
        user_path = get_folder_path(data.get('user_path',''))
        file_type = data.get('file_type','')

        files = get_files(user_path,file_type)

        time_filter = int(data.get('days_unused',30)) * 86400
        size_filter = int(data.get('size_limit_kb',100000)) * 1000
        time_limit = time.time() - time_filter

        filtered_files = return_filtered_files(files,time_limit,size_filter)
        
        #Returns JSON response
        return jsonify({
            'files': [str(f) for f in filtered_files],
            'count': len(filtered_files),
        })
    except Exception as e:
        return jsonify({"error":str(e)}), 500
    
@app.route('/show-archive', methods=['POST']) 
def show_archive():

    """
    Lists all files stored in the Archive folder

    Expects JSON:
    {
        "path": "..."
    }

    Returns:
        JSON: List of archived files and their count
    """

    data = request.json
    user_path = get_folder_path(data.get('path',''))
    archive_path = user_path / "Archive_Junk"
    
    #If the path archive folder exists and is a dictionary get all the files inside it and return JSON response
    
    try:
        if archive_path.exists() and archive_path.is_dir(): 
            archived_files = [str(f) for f in archive_path.glob('*') if f.is_file()]
            return jsonify({'archive_files':archived_files, 'count':len(archived_files)})
        
        else:
            return jsonify({'archive_files': [], 'count' : 0, 'message':'Archive folder not found'})
    
    except Exception as e:
        return jsonify({"error":str(e)}),500
    
@app.route('/show-logs', methods=['POST'])
def show_logs():

    """
    Cleans files based on user-inputted criteria

    Expects JSON:
    {
        "path":"..."
    }

    Returns:
        JSON: Contents of the log file
    """

    data=request.json
    user_path = get_folder_path(data.get('path',''))  
    log_file = user_path / "deleted_files.log"

    #If the log file exists read all lines from it and return JSON response
    try:
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = f.readlines()
            return jsonify({'log': logs, 'count' : len(logs)})
        else:
            return jsonify({'log': [], 'count' : 0, 'message' : 'Log file not found'})    
    except Exception as e:
        return jsonify({"error": str(e)}), 500    
    
@app.route('/show-summary', methods=['GET']) 
def show_summary():

    """
    Reads summary statistics from the summary file

    Returns:
        JSON: Total files delted and the total amount of storage deleted
    """
    #Read contents of JSON file and return it
    try:
        with open("summary_file.json","r") as f:
            data = json.load(f)
        return jsonify(data)

    except FileNotFoundError:
        return jsonify({"total_size":0,"total_files":0})    
    
    except Exception as e:
        return jsonify({"error":str(e)}),500
    
if __name__ == '__main__':
    app.run(debug=True)


 
     
     
     








