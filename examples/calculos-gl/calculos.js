/**
* Author Name: William Alves Jardim
* Project Name: OptiComputation.js
*
* Creation Date: 22/02/2025 12:56 PM
*
* LICENSE: MIT 
*
* Description: A library to calculate computational cost, estimate function execution time and use of RAM memory, without having to execute it first, 
* manage GPUs and threads in a simple way, also provide many methods for manipulating text files, methods for downloading, uploading, measuring its disk size, 
* acquired, header production, meta data of files. Provide methods for process management with Threads and GPU.
*
*/

// Cria a instancia da GPU
const gpu = new OptiComputation.GPUController(); 

// Cria o script GLSL
const codigo = `

precision highp float;

uniform float escala;
uniform vec2 deslocamento;
uniform vec4 cor;

void main() {
    float resultado = (deslocamento.x + deslocamento.y) * escala;
    gl_FragColor = clamp(cor * resultado * escala, vec4(0.0), vec4(1.0));
}

`;

const vetex = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const parametros = {
    escala: 0.1, // Tente com valores menores para evitar saturação
    deslocamento: [-1.0, 2.0],
    cor: [1.5, 0.8, 0.3, 1.0]
};

// Cria uma Thread nessa instancia de GPU
gli = gpu.criarThreadGLSL( codigo, vetex, parametros );