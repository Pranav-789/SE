from pydantic import BaseModel, ConfigDict
import uuid

class RegisterUserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    is_verified: bool = True

    model_config = ConfigDict(from_attributes=True)