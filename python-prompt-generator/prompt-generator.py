from flask import Flask, request, jsonify
from transformers import pipeline, set_seed
import random
import re

app = Flask(__name__)

gpt2_pipe = pipeline('text-generation', model='succinctly/text2image-prompt-generator')

with open("name.txt", "r") as f:
    line = f.readlines()


def generate(starting_text):
    for count in range(6):
        seed = random.randint(100, 1000000)
        set_seed(seed)
    
        # If the text field is empty
        if starting_text == "":
            starting_text: str = line[random.randrange(0, len(line))].replace("\n", "").lower().capitalize()
            starting_text: str = re.sub(r"[,:\-–.!;?_]", '', starting_text)
            print(starting_text)
    
        response = gpt2_pipe(starting_text, max_length=random.randint(60, 90), num_return_sequences=8)
        response_list = []
        for x in response:
            resp = x['generated_text'].strip()
            if resp != starting_text and len(resp) > (len(starting_text) + 4) and resp.endswith((":", "-", "—")) is False:
                response_list.append(resp)
                print(resp)
                print("-------------")

    
        response_end = "\n".join(response_list)
        response_end = response_end.replace("  ", " ");
        response_end = re.sub('[^ ]+\.[^ ]+','', response_end)
        response_end = re.sub('--ar [0-9]{1,2}:[0-9]{1,2}','', response_end)
        response_end = re.sub('--stop [0-9]{1,3}','', response_end)
        response_end = re.sub('::[0-9]{1,3}','', response_end)
        response_end = re.sub('-h [0-9]{1,4}','', response_end)
        response_end = response_end.replace("<", "").replace(">", "").replace(" +", ",")
        if response_end != "":
            print(response_end)
            return response_end


@app.post("/generate")
def generate_prompt():
    if request.is_json:
        draft = request.get_json()["draft"]
        if not draft.startswith('make'):
            return "error", 415
        draft = draft[5:]   # removing make word

        generate(draft)

        return "", 201
    return {"error": "Request must be JSON"}, 415
