//
//  ContentView.swift
//  pinpoint
//
//  Created by Claire Lin on 3/15/25.
//

import SwiftUI
import Foundation
import UIKit
import Vision
import CoreML
import Roboflow
//initalize with your API Key
let rf = RoboflowMobile(apiKey: "API_KEY")
var model: RFObjectDetectionModel?
...

//model is your model's project name
rf.load(model: "YOUR-MODEL-ID", modelVersion: people-detection-o4rdr/8) { [self] model, error, modelName, modelType in
    if error != nil {
        print(error?.localizedDescription as Any)
    } else {
        model?.configure(threshold: threshold, overlap: overlap, maxObjects: maxObjects)
        self.model = model
    }
    
}
...

//model?.detect takes a UIImage and runs inference on it
let img = UIImage(named: "example.jpeg")
model?.detect(image: img!) { predictions, error in
    if error != nil {
        print(error)
    } else {
        print(predictions)
    }
}

struct ContentView: View {
    
    @State private var capturedImage: UIImage? = nil
    @State private var isCameraPresented = false
    @State private var numberOfPeople: Int = 0
    @State private var isLoading = false
    @State private var apiResponse: String = ""
    
    // get current time
    func getTime() -> String {
        let currentDate = Date()
        
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        formatter.dateStyle = .none   // getting only the time
        
        // format the time and return it
        return formatter.string(from: currentDate)
    }
    
    // Function to call Roboflow API and update the number of people
    func detectPeopleWithRoboflow(image: UIImage) {
        // Load Image and Convert to Base64
        let imageData = image?.jpegData(compressionQuality: 1)
        let fileContent = imageData?.base64EncodedString()
        let postData = fileContent!.data(using: .utf8)
        
        // Initialize Inference Server Request with API KEY, Model, and Model Version
        var request = URLRequest(url: URL(string: "https://detect.roboflow.com/people-detection-o4rdr/8?api_key=Kp7I3ACPWmwZ8fhQDKag&name=YOUR_IMAGE.jpg")!,timeoutInterval: Double.infinity)
        request.addValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpMethod = "POST"
        request.httpBody = postData

        
        // Execute Post Request
        URLSession.shared.dataTask(with: request, completionHandler: { data, response, error in

            // Parse Response to String
            guard let data = data else {
                print(String(describing: error))
                return
            }

            // Convert Response String to Dictionary
            do {
                let dict = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
            } catch {
                print(error.localizedDescription)
            }

            // Print String Response
            print(String(data: data, encoding: .utf8)!)
        }).resume()
    }
    
    var body: some View {
        let currentTime = getTime()
        
        VStack {
            Text(currentTime)
                .font(.headline)
                .lineLimit(10)
            
            Spacer()
                .padding()
            //display current image
            if let image = capturedImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 200, height: 200)
                    .cornerRadius(10)
                
                // Display the number of people detected
                Text("Number of people detected: \(numberOfPeople)")
                    .font(.headline)
                    .padding()
                    .foregroundColor(.blue)
                
                // Display API response (for debugging)
                if !apiResponse.isEmpty {
                    Text("API Response: \(apiResponse)")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding()
                }
                
                // Loading indicator
                if isLoading {
                    ProgressView()
                        .padding()
                }
            } else {
                Text("No image captured")
                    .foregroundColor(.gray)
            }
            
            // Button to open the camera
            Button(action: {
                isCameraPresented = true
            }) {
                Text("Open Camera")
                    .font(.headline)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding()
                    .sheet(isPresented: $isCameraPresented) {
                        CameraView(capturedImage: $capturedImage) { image in
                            // When an image is captured, call the Roboflow API
                            detectPeopleWithRoboflow(image: image)
                        }
                    }
            
        }
    }
    
}

// CameraView to handle camera functionality
struct CameraView: UIViewControllerRepresentable {
    @Binding var capturedImage: UIImage?
    @Binding var numberOfPeople: Int

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let imagePicker = UIImagePickerController()
        imagePicker.delegate = context.coordinator
        imagePicker.sourceType = .camera
        imagePicker.allowsEditing = false
        return imagePicker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    // basic facial recognition
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
            var parent: CameraView

            init(_ parent: CameraView) {
                self.parent = parent
            }

            func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
                if let image = info[.originalImage] as? UIImage {
                    parent.capturedImage = image
                    detectFaces(in: image) // Detect faces in the captured image
                }
                picker.dismiss(animated: true)
            }

            func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
                picker.dismiss(animated: true)
            }

            // Function to detect faces in the image
            func detectFaces(in image: UIImage) {
                guard let cgImage = image.cgImage else { return }

                let request = VNDetectFaceRectanglesRequest { (request, error) in
                    if let error = error {
                        print("Face detection error: \(error.localizedDescription)")
                        return
                    }

                    // Count the number of faces detected
                    DispatchQueue.main.async {
                        self.parent.numberOfPeople = request.results?.count ?? 0
                    }
                }

                let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
                do {
                    try requestHandler.perform([request])
                } catch {
                    print("Failed to perform face detection: \(error.localizedDescription)")
                }
            }

    // ML face detection 
    /*
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        var parent: CameraView

        init(_ parent: CameraView) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.capturedImage = image
                detectObjects(in: image) // Detect objects in the captured image
            }
            picker.dismiss(animated: true)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }

        // Function to detect objects in the image using Core ML
        func detectObjects(in image: UIImage) {
            // Load the YOLOv3 model
            let model: VNCoreMLModel

            do {
                let config = MLModelConfiguration()
                let coreMLModel = try YOLOv3(configuration: config).model
                model = try VNCoreMLModel(for: coreMLModel)
            } catch {
                print("Failed to create VNCoreMLModel: \(error)")
                return // Exit the function early if model creation fails
            }

            // Create the request using a non-optional model
            let request = VNCoreMLRequest(model: model) { (request, error) in
                if let error = error {
                    print("Object detection error: \(error.localizedDescription)")
                    return
                }

                // Process the results
                if let results = request.results as? [VNRecognizedObjectObservation] {
                    DispatchQueue.main.async {
                        self.parent.numberOfPeople = results.filter { $0.labels.first?.identifier == "person" }.count
                    }

                    for result in results {
                        // Get the label and confidence score
                        let label = result.labels.first?.identifier ?? "Unknown"
                        let confidence = result.labels.first?.confidence ?? 0

                        // Print the detected object and confidence
                        print("Detected object: \(label) (Confidence: \(confidence))")

                        // Print the bounding box (normalized coordinates)
                        let boundingBox = result.boundingBox
                        print("Bounding box: \(boundingBox)")
                    }
                }
            }

            // Perform the request on an image
            if let cgImage = image.cgImage {
                let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
                do {
                    try requestHandler.perform([request])
                } catch {
                    print("Failed to perform request: \(error.localizedDescription)")
                }
            }
        }
     */
    }
    
}

#Preview {
    ContentView()
}
