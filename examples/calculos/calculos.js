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

// Função que quero executar em GPU
function calcularX(parametrosJSON) { 

    function clc(vl){ 
        return vl + 5 * 5 
    }
    
    const x = clc(parametrosJSON*5); 
    return x;
}

// Cria uma Thread nessa instancia de GPU
gpu.criarThread(calcularX, 50, {

    // Quando a Thread começar
    onComecou: function(){
        console.log('Thread iniciada!');
    },

    // Quando a Thread terminar
    onTerminou: function( resultado ){
        console.log(resultado);
        console.log('Thread finalizada!');
    }

});
