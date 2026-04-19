import "./App.css";
const Analyse = () => {
    return(
        <div className="hero">
            <div className="analyse">
                <div className="left">
                    <h2 style = {{color : "white"}}>Upload your Resume here :</h2>
                    <label className="upload">
                        Upload Your Resume in PDF/DOC/DOCX Format
                        <input type="file" accept=".pdf,.doc,.docx" hidden />
                    </label>
                </div>
                <div className="right">
                    <h2 style = {{color : "white"}}>Job Title : </h2>
                    <input type="text" className="job-title" placeholder="Enter Your Job Title"/>
                    <h2 style = {{color : "white"}}>Job Description : </h2>
                    <textarea className="job-description" placeholder="Enter Job Description Here"></textarea>
                </div>
            </div>
            <div className="act">
                <button className="explore-btn analyse-button">Analyse Resume</button>
                <button className="guide-btn clear-button">Clear</button>
            </div>
            
            

        </div>
    );
}
export default Analyse;