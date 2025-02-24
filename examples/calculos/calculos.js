
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
gpu.criarThread(calcularX, 50);



