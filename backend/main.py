from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from typing import Dict, Optional, Any
import uvicorn

# from form_filler import WebFormFiller
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
async def fill_form(request: dict):
    try:
        mock_data_service = MockDataService()
        user_data = await mock_data_service.get_user_form_data()
        await mock_data_service.cleanup()

        # Comment out Selenium form filler code
        # driver = webdriver.Chrome()
        # form_filler = WebFormFiller(driver, user_data)
        # form_filler.fill_form(request.url)
        # driver.quit()

        # Just return the user data for the extension to handle
        return {"status": "success", "userData": user_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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