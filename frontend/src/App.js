
/**
 * Main App componenet that controls the state and rendering of:
 * - File cleanup operations (archive/delete)
 * - File preview before operations
 * - Archive file management
 * - Operation logging
 * - Summary statistics
 */


//Import React hooks and components

import { useEffect,useState } from "react";
import Header from "./components/Header"
import Button from "./components/Button"
import Form from "./components/Form"
import Swal from  "sweetalert2"


const App = () =>{
  
  //State Hooks

  const [cleanFiles,setCleanFiles] = useState([])
  const [previewFiles,setPreviewFiles] = useState(null)
  const [archiveFiles,setArchiveFiles] = useState([])
  const [logFiles,setLogFiles] = useState([])
  const [activeSection,setActiveSection] = useState(null)
  const [totalCount,setTotalCount] = useState(null)
  const [totalSize,setTotalSize] = useState(null)
  
  //Runs once to show the file summary statistics

  useEffect(() => {handleShowSummary(); 
  },[])

  //Opens the form
  const toggleForm = () => {
    setActiveSection("form")
  }
  //Closes any open section
  const closeActiveSection = () => {
    setActiveSection(null)
    setPreviewFiles(null)
  }

  const togglePreview = () => {
   if(previewFiles){
    setPreviewFiles(null)
   }
   else{
    setActiveSection('form')
   }
  }

  
  //Cleanup operation handlers
  const handleClean = (data) => {
    setCleanFiles(data)
    setPreviewFiles(null)
    handleShowSummary() //Refresh statistics after cleanup
  }
  
  const handlePreview = (files) => {
    setPreviewFiles(files)
    setCleanFiles(null)
  }
  
  /**
   * Fetches and displays log operation files
   */

  const handleShowLogs = async () =>{
    try{
      
      Swal.fire({
        title: "Loading Log files.....",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
          }
      })


      const response = await fetch("http://localhost:5000/show-logs", { // Used to communicate to backend function to show logs
        method: "POST", 
        headers: {"Content-type":"application/json"}, //Communicates to server that data is sent in JSON format
        body: JSON.stringify({ path: ""}) //Data sent back to Flask
        })

      const data = await response.json() //Response from server
      
      if(response.ok){
        setLogFiles(data.log)
        setActiveSection("logs")
        setPreviewFiles(null)
      }
      
      else{
        Swal.fire({
        title: "Server Error",
        text: "Failed to fetch log files. Please try again later",
        icon: "error",
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "OK",
      })

      }

      Swal.close()
    }
    catch(error){
      Swal.fire({
        title: "Network/Client Error",
        text: "Failed to fetch log files. Please check your connection",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "OK",
      })
    }
  }

  /**
   * Fetches and displays archived files
   */

  const handleShowArchive = async () =>{
    try{
      //Modal popup
      Swal.fire({
        title: "Loading Archive files.....",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
          }
      })


      const response = await fetch("http://localhost:5000/show-archive", { 
        method: "POST", 
        headers: {"Content-type":"application/json"},
        body: JSON.stringify({ path: ""}) 
        })

      const data = await response.json() 

      if(response.ok){
        setArchiveFiles(data.archive_files)
        setActiveSection("archive")
        setPreviewFiles(null)
      }
      
      else{
        Swal.fire({
        title: "Server Error",
        text: "Failed to fetch archive files. Please try again later",
        icon: "error",
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "OK",
      })

      }

      Swal.close()
    }
    catch(error){
      Swal.fire({
        title: "Network/Client Error",
        text: "Failed to fetch archive files. Please check your connection",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "OK",
      })
    }
  }

    /**
   * Fetches summary statistics 
   */

  const handleShowSummary = async () =>{
    try{
      

      const response = await fetch("http://localhost:5000/show-summary", { 
        method: "GET", //GET http method to match backend
        })

      const data = await response.json() 
      
      if(response.ok){
        setTotalCount(data.total_files)
        setTotalSize(data.total_size)
      }
      else{
        alert(data.message || 'Error fetching summary file');     }
    }
    catch(error){
      alert("Failed to fetch summary file")
    }
  }
   
  return (
    <>
        {/* Header with summary statistics*/}

        <div className = "title-timer">
          <Header title="File Sweeper" />

          <div>
            <p className="summary fade-in">Total files cleaned: {totalCount} </p>
          </div>
            <p className="summary fade-in">Total size saved: {totalSize} </p>
        </div>

        <div className="app-container">
          
          {/* Main action buttons*/}

          <div className="action-bar">
            <Button
              color ={activeSection === "form" ? "red" : "green"}
              text ={activeSection === "form" ? "Close" : "Clean files"}
              onClick ={activeSection === "form" ? closeActiveSection : toggleForm}
              type="button"
              />

              <Button
              color ={activeSection === "archive" ? "red" : "blue"}
              text ={activeSection === "archive" ? "Close" : "Show Archive files"}
              onClick ={activeSection === "archive" ? closeActiveSection : handleShowArchive}
              type="button"
              />

              <Button
              color ={activeSection === "logs" ? "red" : "purple"}
              text ={activeSection === "logs" ? "Close" : "Show logs"}
              onClick ={activeSection === "logs" ? closeActiveSection : handleShowLogs}
              type="button"
              />
              </div>

              {/* Form section with preview option*/}
              {activeSection === "form" && (
                <div className={`form-preview-wrapper ${previewFiles ? "with-preview" : ''}`}>
                  <div className="form-container">
                    <Form onClean={handleClean} onPreview={handlePreview} previewFiles={previewFiles} togglePreview={togglePreview}/>
                  </div>

                  {previewFiles && (
                    <div className="preview-section">
                      <div className="preview-list">
                        <h3>Files to be Cleaned:</h3>
                        {previewFiles.length === 0 ? (
                          <p>No files found matching your criteria</p>
                        ) : (
                          <ul>
                            {previewFiles.map((file,index) => (
                              <li key={index}>{file}</li> 
                            ))}
                          </ul>
                        )}
                        </div>         
                      </div>
                  )}
                  </div>
                )}
                </div>
                
                {/* Archive files display*/}

                <div className="archive-section">
                  {activeSection === "archive" && (
                    <div className = "archive-list">
                      <h3>Archived Files:</h3>
                      {archiveFiles.length === 0 ? (
                        <p>No files found in archive</p>
                      ) : (
                        <ul>
                          {archiveFiles.map((file,index) => (
                            <li key={index}>{file}</li>
                          ))}
                          </ul>
                      )}
                      </div>
                  )}
                  </div>
                  
                  {/* Log files display*/}

                  <div className="logs-section">
                    {activeSection === "logs" && (
                      <div className="logs-list">
                        <h3>Log Files:</h3>
                        {logFiles.length === 0 ? (
                          <p>No files found in logs.</p>
                        ) : (
                          <ul>                         
                          {logFiles.map((file,index) => (
                            <li key={index}>{file}</li>  
                        ))}
                        </ul>
                        )}
                        </div>
                    )}
                    </div>
                  </>
                  )
                }     
                
                
export default App;
    
    


  







  


































































