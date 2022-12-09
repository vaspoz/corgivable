from transformers import pipeline, set_seed
import random
import re
import boto3
import json

sqs_client = boto3.client("sqs")
sns_client = boto3.client("sns")
sqs_name = "https://sqs.eu-central-1.amazonaws.com/947990993987/inbound-prompt-drafts"
sns_arn = "arn:aws:sns:eu-central-1:947990993987:ready-prompt"

# GPT3 stuff
gpt2_pipe = pipeline('text-generation', model='succinctly/text2image-prompt-generator')

def generate_prompt(starting_text):
    with open("name.txt", "r") as f:
        line = f.readlines()

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
    response_end = response_end.replace("  ", " ")
    response_end = response_end.replace(": :", "")
    response_end = response_end.replace("-h 350", "")
    response_end = re.sub('[^ ]+\.[^ ]+','', response_end)
    response_end = re.sub('--ar [0-9]{1,2}:[0-9]{1,2}','', response_end)
    response_end = re.sub('--stop [0-9]{1,3}','', response_end)
    response_end = re.sub('--w [0-9]{1,3}','', response_end)
    response_end = re.sub('::[0-9]{0,3}','', response_end)
    response_end = re.sub('--h [0-9]{1,4}','', response_end)
    response_end = response_end.replace("  ", " ")
    response_end = response_end.replace("<", "").replace(">", "").replace(" +", ",")

    for prompt in response_end.split("\n"):
        combined_prompt = "/imagine prompt: " + prompt + " --v 4 --q 2" 
        print(combined_prompt)
        sns_publish_message(combined_prompt)


# Simple Queue Service stuff
def sqs_send_message(message):
    sqs_client.send_message(
        QueueUrl=sqs_name,
        MessageBody=message
    )

def sqs_delete_message(receipt_handle):
    sqs_client.delete_message(
        QueueUrl=sqs_name,
        ReceiptHandle=receipt_handle,
)

def sqs_receive_message():
    response = sqs_client.receive_message(
        QueueUrl=sqs_name,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=5,
    )

    print(f"Number of messages received: {len(response.get('Messages', []))}")

    return response.get("Messages", [])


# Simple Notification Service stuff
def sns_publish_message(message):
    sns_client.publish(
        TargetArn=sns_arn, 
        Message=message
    )


# Main body
rs = sqs_receive_message()
while len(rs)>0:
    for messageJson in rs:
        # Get the message from SQS (prompt draft)
        message=messageJson["Body"]
        print('Message received: ' + message)

        generate_prompt(message)
        print("Generated")
        sqs_delete_message(messageJson["ReceiptHandle"])
    
    rs=sqs_receive_message()