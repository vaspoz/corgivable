from transformers import pipeline, set_seed
import random
import re

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
    
        response_end = "\n".join(response_list)
        response_end = re.sub('[^ ]+\.[^ ]+','', response_end)
        response_end = response_end.replace("<", "").replace(">", "")
        if response_end != "":
            return response_end
        if count == 5:
            return response_end


article = "<div><center><img src='https://visitor-badge.glitch.me/badge?page_id=max_skobeev_prompt_generator_public' alt='visitor badge'></center></div>"

print(generate("Disney princess"))