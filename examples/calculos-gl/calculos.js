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
// Código GLSL do vértice shader
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const parametros = {
    escala: 0.1, // Tente com valores menores para evitar saturação
    deslocamento: [-1.0, 2.0],
    cor: [1.5, 1.08, 0.3, 1.0]
};

// Cria uma Thread nessa instancia de GPU
gli = gpu.criarThreadGLSL( codigo, vetex, parametros, { matricial: false } );


/**
* outro exemplo
*/
const fragmentShader2 = `
    precision highp float;
    uniform vec4 cor;
    void main() {
        gl_FragColor = cor;
    }
`;

const vertexShader2 = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const parametros2 = {
    cor: [0.1, 0.5, -0.1, 0.1] // Cor vermelha
};

const resultado2 = gpu.criarThreadGLSL(fragmentShader2, vertexShader2, parametros2, { matricial: false });
console.log(resultado2.output); // Saída será o valor da cor gerado pelo shader
