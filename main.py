from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegistration(BaseModel):
    name: str
    email: str


class RegistrationService:

    @staticmethod
    def process_data(user_data):
        try:
            print(f"\n\nимя: {user_data.name}\n")
            print(f"email: {user_data.email}\n")
            return 1
        except Exception as e:
            print(e)
            return 0

@app.post("/register")
async def read_root(user: UserRegistration):
    if RegistrationService.process_data(user):
        return {"success": True}
    return {"success": False}
