from pydantic import BaseModel

class AnimalCreate(BaseModel):
    name: str
    animal_id: str
    type: str
    breed: str
    age: int
    health_status: str