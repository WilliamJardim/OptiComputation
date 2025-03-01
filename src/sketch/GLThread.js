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

if( window.OptiComputation.sketch == undefined )
{
    window.OptiComputation.sketch = {};
}

window.OptiComputation.sketch.GLThread = class {
    constructor(configThread){
        this.timestampCriado = new Date().getTime();

        this.gl              = configThread.gl;
        this.program         = configThread.program;
        this.framebuffer     = configThread.framebuffer;
        this.texture         = configThread.texture;
        this.canvas          = configThread.canvas;
        this.output          = configThread.output;

        this.terminou        = false;
        this.usoRAM          = 0;
        this.funcao          = configThread.funcao;
        this.parametros      = configThread.parametros;
        
        this.callbacks = {
            onComecou  : configThread.callbacks.onComecou  || function(){},
            onTerminou : configThread.callbacks.onTerminou || function(resultado){}
        },

        this._internal       = {
            usoMemoriaComecou:    configThread._internal.usoMemoriaComecou || null,
            usoMemoriaTerminou:   configThread._internal.usoMemoriaTerminou || null,
            tempoFinalizada:      configThread._internal.tempoFinalizada || null
        },

        this.duracaoTempo = null;
    }

    /**
    * Função que registra que essa Thread começou
    */
    registrarInicio(){
        //Informações da CPU quanto essa thread começou
        const tempoComecou = new Date().getTime();
        const usoMemoriaComecou = OptiComputation.hardware.RAM.getUsage();

        // Salva essas informações da CPU
        this._internal.tempoComecou = tempoComecou;
        this._internal.usoMemoriaComecou = usoMemoriaComecou;
        this.terminou = false;
    }

    /**
    * Função que registra que essa Thread já terminou 
    */
    registrarFim(){
        //Informações da CPU quanto essa thread terminou
        const tempoComecou       = this._internal.tempoComecou; 
        const tempoTerminou      = new Date().getTime();
        const usoMemoriaComecou  = this._internal.usoMemoriaComecou;
        const usoMemoriaTerminou = OptiComputation.hardware.RAM.getUsage();
        const gastoMemoria       = Math.abs(usoMemoriaComecou - usoMemoriaTerminou); //Gasto de memoria em bytes

        // Salva essas informações da CPU
        this.usoRAM = gastoMemoria;
        this._internal.usoMemoriaComecou = usoMemoriaComecou;
        this._internal.usoMemoriaTerminou = usoMemoriaTerminou;
        this.terminou = true;
        this._internal.tempoFinalizada = tempoTerminou;
        this.duracaoTempo = Math.abs( tempoComecou - tempoTerminou );
    }

}