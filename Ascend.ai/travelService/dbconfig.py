import pymongo

try:
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    database = client["travel_database"]

    print("Connected to MongoDB")

    collection_name = "your_collection_name"

    if collection_name in database.list_collection_names():
        collection = database[collection_name]
        print(f"Collection '{collection_name}' already exists.")
    else:
        collection = database.create_collection(collection_name)
        print(f"Collection '{collection_name}' created successfully.")

except Exception as e:
    print(f"Error: {e}")