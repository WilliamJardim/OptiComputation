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
//const gpu = new OptiComputation.GPUController(); 

// Cria o script GLSL
const codigo_matricial = `
precision highp float;

uniform mat2 matrizA;
uniform mat2 matrizB;

void main() {
    // Exemplo de multiplicação de matrizes 2x2
    mat2 resultado = matrizA * matrizB;
    
    // Exemplo de armazenar o valor final como uma cor (somente como exemplo de saída)
    gl_FragColor = vec4(resultado[0][0], resultado[0][1], resultado[1][0], resultado[1][1]);
}
`;

const vetex_matricial = `
// Código GLSL do vértice shader
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;


const parametros_matricial = {
    matrizA: [0.1, 0.2, 0.3, 4.0],  // Matriz 2x2
    matrizB: [0.5, 0.6, 0.7, 8.0],  // Outra matriz 2x2
};

gli_matricial = gpu.criarThreadGLSL( codigo_matricial, vetex_matricial, parametros_matricial, { matricial: true } );
