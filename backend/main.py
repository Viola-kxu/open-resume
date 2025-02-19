from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from typing import Dict, Optional, Any
import uvicorn

from form_filler import WebFormFiller
from mock_data import MockDataService

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],  # Allow Chrome extensions
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mock_service = MockDataService()

class FillFormRequest(BaseModel):
    url: str
    userData: Dict[str, Any] = {}
    resume_path: Optional[str] = None

@app.post("/api/fill-form")
async def fill_form(request: FillFormRequest):
    try:
        print(f"Received request for URL: {request.url}")
        user_data = await mock_service.get_user_form_data()
        print(f"Retrieved user data: {user_data}")
        
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        print("Initializing Chrome driver...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(
            service=service,
            options=chrome_options
        )
        
        form_filler = WebFormFiller(
            driver=driver,
            user_data=user_data if not request.userData else request.userData
        )
        
        print("Starting form fill...")
        form_filler.fill_form(request.url)
        
        return {
            "status": "success",
            "userData": user_data
        }
        
    except Exception as e:
        print(f"Error in fill_form: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'driver' in locals():
            driver.quit()
        await mock_service.cleanup()

@app.get("/test")
async def test_connection():
    try:
        await mock_service.get_user_form_data()
        return {"status": "Database connected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await mock_service.cleanup()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 