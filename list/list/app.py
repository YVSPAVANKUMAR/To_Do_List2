from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb+srv://pavan:12345@cluster0.niurnqg.mongodb.net/')
db = client.to_do_list

# Home route
@app.route("/")
def index():
    return render_template("index.html")

# ➝ Helper
def serialize_task(task):
    return {
        "_id": str(task["_id"]),
        "email": task["email"],
        "text": task["text"],
        "datetime": task.get("datetime"),
        "priority": task.get("priority", "low")
    }

# ➝ Add task
@app.route("/api/addTask", methods=["POST"])
def add_task():
    data = request.json
    email = data.get("email")
    text = data.get("text")
    datetime_val = data.get("datetime")
    priority = data.get("priority", "low")

    if not email or not text:
        return jsonify({"success": False, "error": "Email and text are required"}), 400

    task = {
        "email": email,
        "text": text,
        "datetime": datetime_val,
        "priority": priority
    }
    result = db.tasks.insert_one(task)
    task["_id"] = result.inserted_id
    return jsonify({"success": True, "task": serialize_task(task)}), 201

# ➝ Get tasks by email
@app.route("/api/getTasks/<email>", methods=["GET"])
def get_tasks(email):
    tasks_cursor = db.tasks.find({"email": email})
    tasks = [serialize_task(task) for task in tasks_cursor]
    return jsonify(tasks), 200

# ➝ Delete task
@app.route("/api/deleteTask/<id>", methods=["DELETE"])
def delete_task(id):
    try:
        result = db.tasks.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 1:
            return jsonify({"success": True}), 200
        return jsonify({"success": False, "error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ➝ Edit task
@app.route("/api/updateTask/<id>", methods=["PUT"])
def update_task(id):
    data = request.json
    text = data.get("text")
    datetime_val = data.get("datetime")
    priority = data.get("priority")

    update_fields = {}
    if text: update_fields["text"] = text
    if datetime_val: update_fields["datetime"] = datetime_val
    if priority: update_fields["priority"] = priority

    if not update_fields:
        return jsonify({"success": False, "error": "No update fields provided"}), 400

    try:
        updated_task = db.tasks.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": update_fields},
            return_document=True
        )
        if updated_task:
            return jsonify({"success": True, "task": serialize_task(updated_task)}), 200
        return jsonify({"success": False, "error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
