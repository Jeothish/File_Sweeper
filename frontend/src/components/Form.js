
/**
 * File Cleanup Form Component:
 * - Provoides interface for configuring and executing file cleanup operations
 * - Supports file filtering by path, type, age, ad size with preview functionality
 */


import { useState } from "react";
import Swal from "sweetalert2"
import Button from "./Button"

const Form = ({onClean, onPreview, previewFiles, togglePreview}) => {
  
  //State hooks with defaults handled in backend
  
  const [path,setPath] = useState('')
  const [fileType,setFileType] = useState('')
  const [days,setDays] = useState('')
  const [minSize,setMinSize] = useState('')

  /** 
   * Handles main cleanup operation 
  */

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = {
      user_path : path || "",
      file_type : fileType || "",
      days_unused : parseInt(days) || 30,
      size_limit_kb : parseInt(minSize) || 100000,
    }

    try {
      
      //Choose between delteing or archiving
      
      const result = await Swal.fire({
        title: "Choose Action",
        text: "What would you like to do with the matching files?",
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Archive Files',
        denyButtonText: 'Delete Files',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#e70c0cff',
        cancelButtonColor: '#7a838cff',
        allowOutsideClick: false
      })

      if (result.isDismissed){
        return
      }

      let isArchive
      if (result.isConfirmed){
        isArchive = true
      }
      
      else if (result.isDenied){
        isArchive = false
      }

      else{
        return
      }

      let finalConfirmation

      if(isArchive){

        //Archive menu
        
        finalConfirmation = await Swal.fire({

          title: "Archive Files?",
          html:`
          <p>Files will be moved to a safe <strong> Archive_Junk </strong> folder.</p>
          <p>You can restore them later if needed.</p>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Yes, Archive',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#21e90fff',
          cancelButtonColor: '#7a838cff',
        })
      }
      else{

        //Delete menu

        finalConfirmation = await Swal.fire({

          title: "Delete Files?",
          html:`
          <p><strong> Warning:</strong> This action CANNOT be undone!</p>
          <p>Files will be permanently deleted from your system.</p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Delete',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#e90f0fff',
          cancelButtonColor: '#7a838cff',
        })
      }

        if (!finalConfirmation.isConfirmed){
          return
        }

        //Show loading during the operation

        Swal.fire({
          title: isArchive ? 'Archiving Files...' : "Deleteing Files...",
          text: "Please wait while we process your files",
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen:() => {
            Swal.showLoading()
          }      
        })

        const requestBody = {
          ...formData,
          archive: isArchive,
        }
        
        //Execute cleaning operation

        const response = await fetch("http://localhost:5000/clean", { 
        method: "POST", 
        headers: {"Content-type":"application/json"}, 
        body: JSON.stringify(requestBody) 
        })

        if (!response.ok){
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        Swal.close()

        onClean(data)
        
        //Show results
        
        if ( data.count === 0) {
          await Swal.fire({
          title: "No Files Found",
          text: "No files match your current criteria. Try adjusting your filters",
          icon: "info",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        })
      }

        else{
          Swal.fire({
          title: "Success!",
          text: `${data.count} file were successfully ${isArchive ? "archived" : "deleted"}.`,
          icon: 'success',
          confirmButtonText: "Great!",
          confirmButtonColor: "#28a745",      
        })
      }
    }
    catch (error){
      Swal.close()
      await Swal.fire({
          title: "Network/Client Error!",
          text: error.message || `Failed to process files. Please check your connection and try again`,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#eb0d0dff",
        })
    }
  }
  
  /**
   * Shows preview of files that would be cleaned based on current criteria
   */
  
  const handlePreview = async (e) =>{
    e.preventDefault()

    const requestBody = {
      user_path: path || "",
      file_type: fileType || "",
      days_unused: parseInt(days) || 30,
      size_limit_kb: parseInt(minSize) || 100000,
    }
      try{
        
        Swal.fire({
          title: "Loading Preview.....",
          text: "Scanning for files that match your criteria",
          icon: "info",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading()
            }
        })
  
  
        const response = await fetch("http://localhost:5000/preview", { 
          method: "POST", 
          headers: {"Content-type":"application/json"}, 
          body: JSON.stringify(requestBody) 
          })
  
        const data = await response.json() 
       
        
        Swal.close()
        
        if(response.ok){
          onPreview(data.files)

          if(data.files.length === 0){
            await Swal.fire({           
              title: "No Files Found",
              text: "No files match your current criteria",
              icon: "info",
              confirmButtonText: "OK",
              confirmButtonColor: "#3085d6"
        })
      }
      else{
        await Swal.fire({
          title: "Preview Ready!",
          text: `Found ${data.files.length} files matching your criteria`,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: '#28a475'
        })
      }

          }
        
        else{
          await Swal.fire({
          title: "Preview Error!",
          text: data.message || "Error previewing files",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545"
        })
        }
      }
      catch(error){
        Swal.close()
        await Swal.fire({
          title: "Network Error!",
          text: "Failed to preview files. Please check your connection",
          icon: "error",
          confirmButtonColor: "#dc3545",
          confirmButtonText: "OK",
        })
      }
    }

    return (

      
      <form className="add-form" onSubmit={handleSubmit}>
        
        <div className="form-control">
          <label>File path</label>
          <input type="text" placeholder="Leave blank for downloads" value={path} onChange={(e) => setPath(e.target.value)} />
        </div>

        <div className="form-control">
          <label>File type</label>
          <input type="text" placeholder="Leave blank for all file types" value={fileType} onChange={(e) => setFileType(e.target.value)} />
        </div>

        <div className="form-control">
          <label>Days unused</label>
          <input type="text" placeholder="Leave blank for 30 days" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>

        <div className="form-control">
          <label>Skip files greater than (KB)</label>
          <input type="text" placeholder="Leave blank for 100000 (100 MB)" value={minSize} onChange={(e) => setMinSize(e.target.value)} />
        </div>

        <Button
          color ={previewFiles ? "red" : "orange"}
          text ={previewFiles ? "Close Preview" : "Preview files before Deletion"}
          onClick ={previewFiles ? togglePreview : handlePreview}
          type="button"
          />

          <input type="submit" className="btn" value="Clean Files" />
      </form>
    )
  }
  
  export default Form

