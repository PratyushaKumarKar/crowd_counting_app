
import cv2
import numpy as np
from openvino import Core
import fileinput
import base64


def process_frame(image_path):
 
    # Load the OpenVINO model:
    model_bin = "person-detection-0303.bin"
    model_xml = "person-detection-0303.xml"
    ie = Core()
    net = ie.read_model(model=model_xml, weights=model_bin)
 
    # Identify the input and output blobs of the model:
    input_blob = next(iter(net.inputs))
 
    # Compile the model for a target device:
    exec_net = ie.compile_model(net, device_name="CPU")
    
    # Base64-encoded image URL
    base64_image_url = image_path

    # Decode the base64 image
    base64_image_data = base64_image_url.split(',')[1]  # Remove data URI prefix
    image_data = base64.b64decode(base64_image_data)
    image_np = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)


    # Convert from RGB to BGR format
    bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    input_image = cv2.resize(bgr_image, (input_blob.shape[3], input_blob.shape[2]))
    input_image = np.transpose(input_image, (2, 0, 1))
 
    input_image = np.expand_dims(input_image,axis=0)
    output = exec_net.infer_new_request(input_image)
    del input_image                                     # saving memory crash error

    #counting the number of people in the frame ( post processing )
    count=0
    for cor in output[0]:
        if cor[4]>0.25:
            count+=1
 
    return count
 
if __name__ == "__main__":
    frame_data = ''
    
    # Read the frame data from stdin
    for line in fileinput.input():
        frame_data += line

    # Process the frame data
    result = process_frame(frame_data)
    print(result)