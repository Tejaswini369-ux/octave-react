import React, { useState } from 'react';
import axios from 'axios';
import image from '../../image.png';

const LMS = () => {
  const [inputs, setInputs] = useState([
    { id: 'step-size', label: 'Step-size (µ)', min: 0.001, max: 0.1, step: 0.001, value: 0.01 },
    { id: 'num-samples', label: 'Number of Samples (N)', min: 10, max: 1000, step: 10, value: 500 },
    { id: 'signal-power', label: 'Signal Power', min: 0.005, max: 0.05, step: 0.001, value: 0.01 },
    { id: 'noise-power', label: 'Noise Power', min: 0.001, max: 0.01, step: 0.001, value: 0.001 }
  ]);

  const [code, setCode] = useState('');
  const [codeHtml, setCodeHtml] = useState('Code will be generated here.!');
  const [imageUrls, setImageUrls] = useState(new Array(1).fill(image));
  const [loading, setLoading] = useState(false);
  const [showImages, setShowImages] = useState(false);


  const handleInputChange = (id, value) => {
    const input = inputs.find(input => input.id === id);
    const newValue = Math.min(Math.max(value, input.min), input.max);
    setInputs(inputs.map(input => input.id === id ? { ...input, value: newValue } : input));
  };


  const handleGenerateCode = () => {
    const generatedCode = `
    function lms_equal(N, signal_power, noise_power, mu)
    % N: Number of samples
    % signal_power: Power of the signal
    % noise_power: Power of the noise
    % mu: Step size for LMS algorithm

    h = [2 1];  % Impulse response of channel
    x = sqrt(signal_power) .* randn(1, N);  % Input signal
    d = conv(x, h);
    d = d(1:N) + sqrt(noise_power) .* randn(1, N);  % Introduction of noise

    w0(1) = 0;  % Initial filter weights
    w1(1) = 0;

    y(1) = w0(1) * x(1);  % Filter output
    e(1) = d(1) - y(1);  % Error signal
    w0(2) = w0(1) + 2 * mu * e(1) * x(1);  % Update weights
    w1(2) = w1(1);  % Update weights

    for n = 2:N  % LMS algorithm
        y(n) = w0(n) * x(n) + w1(n) * x(n-1);  % Filter output
        e(n) = d(n) - y(n);  % Error signal
        w0(n+1) = w0(n) + mu * e(n) * x(n);  % Update weight
        w1(n+1) = w1(n) + mu * e(n) * x(n-1);  % Update weight
    endfor

    mse = zeros(1, N);
    for i = 1:N
        mse(i) = abs(e(i)).^2;
    endfor

    n = 1:N;
    semilogy(n, mse);  % MSE versus time
    xlabel('Adaptation cycles');
    ylabel('MSE');
    title('Adaptation cycles vs. MSE');
endfunction
N = 500;  % Number of samples
signal_power = 1;  % Signal power
noise_power = 0.01;  % Noise power
mu = 0.001;  % Step size for LMS algorithm

lms_equal(N, signal_power, noise_power, mu);
 `;
    setCode(generatedCode);
    setCodeHtml(`<pre>${generatedCode}</pre>`);
  };

  const handleRun = async () => {
  setLoading(true);  // Start loading
  setShowImages(false);  // Hide images until new ones are loaded
  const data = {
    N:inputs.find(input=>input.id === 'num-samples').value,
    signal_power: inputs.find(input => input.id === 'signal-power').value,
    noise_power: inputs.find(input => input.id === 'noise-power').value,
    mu: inputs.find(input => input.id === 'step-size').value
  };

  try {
    const response = await axios.post('http://localhost:5000/lms_equ', data, {
      headers: {
        // 'Content-Type': 'multipart/form-data'
      }
    });
    
    setImageUrls(response.data.images.map(img => `http://localhost:5000${img}`));
    setShowImages(true);  // Show images after loading
  } catch (error) {
    console.error('Error running the script:', error);
  } finally {
    setLoading(false);  // Stop loading
  }
};
  
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "rls_denoise.m";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const SphereLoading = () => (
  <div className="flex felx-col fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ">
    <div className="w-20 h-10">
      <div className="relative w-full h-full overflow-hidden p-2 pl-3">
        <p className='font-sans text-sm font-bold'>Loading...</p>
        <div className="absolute inset-0 bg-blue-button rounded-lg animate-pulse opacity-0 text-black">
        </div>
        
      </div>
    </div>
  </div>  
);

  return (
    <div className='flex flex-col space-y-10'>
      <div className="flex flex-row gap-5 space-x-5"> 
        <div className='flex flex-col'>
          <iframe
            srcDoc={codeHtml}
            title="Generated Code"
            width="650"
            height="262"
            className='outline border-4 p-2 rounded-sm border-blue-hover'
          ></iframe>
          <div className='flex justify-between text-sm'>
            <button 
              className="bg-blue-button rounded-lg px-3 py-1 hover:bg-blue-hover mt-8"
              onClick={handleDownload}
            >
              Download
            </button>
            <button 
              className="bg-blue-button rounded-lg px-3 py-1 hover:bg-blue-hover mt-8"
              onClick={handleRun}
            >
              Submit & Run
            </button>
          </div>
        </div>
        <div className="text-sm">
          <div className='flex flex-col items-center'>
            <p className='font-bold'>
            Select the input Parameters
            </p>
            <div className='bg-blue-hover px-5 py-3 mt-2 rounded-xl'>
              {inputs.map(input => (
                <div key={input.id} className="flex flex-col items-center">
                  <label htmlFor={input.id} className="block mb-2">
                    <pre className='font-serif'>
                      <span>{input.min} ≤ </span> {input.label} <span> ≤  {input.max} </span>
                    </pre>
                  </label>
                  <div className="flex flex-row items-center">
                    <input
                      type="number"
                      id={input.id}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      value={input.value}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      className="w-16 text-center border border-gray-300 rounded-lg py-1 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="range"
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      value={input.value}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      className="flex-grow ml-2 "
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <button onClick={handleGenerateCode} className="bg-blue-button rounded-lg px-3 py-1 hover:bg-blue-hover mt-10">
              Generate Code
            </button>
          </div>
        </div>
      </div>
       {loading && <SphereLoading/>}
        {!loading && showImages && (
          <div className=' mt-5 flex flex-col space-y-2'>
            {imageUrls.map((url, index) => (
              <img key={index} src={url} alt={`Output ${index + 1}`}/>
            ))}
          </div>
        )}
    </div>
  );
};

export default LMS;