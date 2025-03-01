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

window.OptiComputation.GPUController = class{
    constructor(){
        this.threadsCriadas = [];
        this.mapaThreads = {};
    }

    /**
    * Retorna todos os threads criados 
    */
    getThreads = function(){
        return this.threadsCriadas;
    }

    /**
    * Retorna a referencia de uma Thread pelo timestamp dela 
    */
    getThreadById = function( timestamp ){
        return this.mapaThreads[ timestamp ];
    }

    /**
    * Imprime todas as threads no console 
    */
    printThreads = function(){
        const keysThreads = Object.keys( this.mapaThreads );
        const tabelaThreads = [];

        for( let i = 0 ; i < keysThreads.length ; i++ )
        {
            const timestampThread = keysThreads[i];

            tabelaThreads.push( [timestampThread] );
        }

        console.table(tabelaThreads);
    }

    /**
    * Cria um Thread para executar uma função
    * 
    * @param {Function} funcao  
    * @param {Any} parametros
    * 
    * NOTA: O retorno  da funcao, não pode ser o propio parametros
    * 
    * Exemplos aleatorios que testei:
    * 
    * @example
    * gpu = new OptiComputation.GPUController(); 
    * gpu.criarWorker(function gononono(parametrosJSON) { function clc(vl){ return vl + 5 * 5 } ; const x = clc(parametrosJSON*5) ; return x }, 50);
    *
    */
    criarThread = function( funcao, parametros, callbacks={} ){
        
        const funcaoString = String(funcao).trim();
        const isFuncaoComNome = funcaoString.indexOf('function ') != -1 && funcaoString[funcaoString.indexOf('function ')+1] != '(';
        
        //Como a função começa
        const inicioFuncao = isFuncaoComNome ? (
                                                funcaoString.slice(//Onde começa o function NOME
                                                                   funcaoString.indexOf('function ', 0), 
                                                                   //Até onde termina a abertura do bloco da função
                                                                   funcaoString.indexOf( '{' , funcaoString.indexOf('function ')
                                                                  )
                                                ))
        
                                             : funcaoString.split('{')[0]

        // Apenas o nome da função
        const nomeFuncao   = inicioFuncao.split('function ')[1].split('(')[0];

        //O que tem dentro da função
        const corpoFuncao  = funcaoString.split(inicioFuncao)[1];


        //Função que vai poder conversar com o WebWorker
        let funcaoThread = `function(parametrosJSON)${ corpoFuncao }`;

        /**
        * no corpo de uma função já extraido, vai transformar "return ALGUMA_COISA" em "self.postMessage( ALGUMA_COISA )", PORÈM SOMENTE NO NIVEL RAIZ DESSE CORPO FUNÇÂO e não em subniveis, por exemplo "{ return 10 }" ele vai fazer "{ self.postMessage(10) }" porém, "{ function calculo(x){ return x*2 } return calculo(5) }" ele vai fazer somente "{ function calculo(x){ return x*2 } self.postMessage(calculo(5)) }", ou seja, sem aplicar o self.postMessage para os subniveis
        * @param {String} code 
        * @returns {String}
        */
        function transformRootReturn(code) {
            let result = "";
            let level = 0;
            let i = 0;
            const length = code.length;
            
            // Estados para strings e comentários
            let inString = false;
            let stringChar = null;
            let inComment = false;
            let commentType = null; // "line" ou "block"
            
            while (i < length) {
                const char = code[i];
                
                // Se estivermos dentro de uma string, apenas copiar
                if (inString) {
                    result += char;
                    // Se o caractere for o delimitador e não estiver escapado, encerra a string
                    if (char === stringChar && code[i - 1] !== '\\') {
                        inString = false;
                        stringChar = null;
                    }
                    i++;
                    continue;
                }
                
                // Se estivermos dentro de um comentário, copiar até o fim dele
                if (inComment) {
                    result += char;
                    if (commentType === "line" && char === "\n") {
                        inComment = false;
                        commentType = null;

                    } else if (commentType === "block" && char === "*" && code[i + 1] === "/") {
                        result += "/";
                        i += 2;
                        inComment = false;
                        commentType = null;
                        continue;
                    }
                    i++;
                    continue;
                }
                
                // Detecta início de comentário
                if (char === "/" && code[i + 1] === "/") {
                    inComment = true;
                    commentType = "line";
                    result += char;
                    i++;
                    continue;
                }
                if (char === "/" && code[i + 1] === "*") {
                    inComment = true;
                    commentType = "block";
                    result += char;
                    i++;
                    continue;
                }
                
                // Detecta início de string (simples, duplas ou template literals)
                if (char === '"' || char === "'" || char === "`") {
                    inString = true;
                    stringChar = char;
                    result += char;
                    i++;
                    continue;
                }
                
                // Atualiza o nível de aninhamento
                if (char === "{") {
                    level++;
                    result += char;
                    i++;
                    continue;
                }
                if (char === "}") {
                    level--;
                    result += char;
                    i++;
                    continue;
                }
                
                // Verifica se há "return" no nível raiz (level === 1)
                if (level === 1 && code.slice(i, i + 6) === "return") {
                    // Verifica se "return" não é parte de outra palavra:
                    const prevChar = i > 0 ? code[i - 1] : " ";
                    const nextChar = code[i + 6] || " ";
                    if (!(/[a-zA-Z0-9_$]/.test(prevChar)) && !(/[a-zA-Z0-9_$]/.test(nextChar))) {
                        // Encontrou um return no nível raiz
                        i += 6; // pula a palavra "return"
                        
                        // Pula os espaços em branco seguintes
                        while (i < length && /\s/.test(code[i])) {
                           i++;
                        }
                        
                        // Captura a expressão do return até encontrar um ponto-e-vírgula (;) ou o fim do statement
                        let expr = "";
                        let exprLevel = 0; // para agrupar parênteses ou colchetes dentro da expressão
                        while (i < length) {
                            const c = code[i];
                            // Se não estivermos dentro de agrupamentos e encontrarmos ; ou } (fim do statement), encerra a captura
                            if (exprLevel === 0 && (c === ";" || c === "\n" || c === "}")) {
                                break;
                            }
                            // Se abrir agrupadores, incrementa (considera somente () e []; tratar {} dentro de expressões é mais complexo)
                            if (c === "(" || c === "[") {
                                exprLevel++;
                            } else if ((c === ")" || c === "]") && exprLevel > 0) {
                                exprLevel--;
                            }
                            expr += c;
                            i++;    
                        }
                        expr = expr.trim();
                        
                        // Se houver ponto-e-vírgula, pula-o
                        if (i < length && code[i] === ";") {
                            i++;
                        }
                        
                        // Insere a substituição: self.postMessage( expressão )
                        result += "self.postMessage(" + expr + ")";
                        continue;
                    }
                }
                
                // Caso contrário, copia o caractere normalmente
                result += char;
                i++;
            }
            
            return result;
        }

        //Sempre que a função tiver return, ele vai trocar para "self.postMessage(O QUE TIVER NO RETURN)"
        //funcaoString.split('return').join( `self.postMessage( ${  } )` );
        funcaoThread = transformRootReturn(funcaoString);

        //Sempre que o programador usar "parametrosJSON", ele vai trocar para "parametrosJSON.data"
        funcaoThread = funcaoThread.split("parametrosJSON").join("parametrosJSON.data");

        // Retirar o parametrosJSON.data dos parametros da função, pra não dar problema
        funcaoThread = funcaoThread.replace(funcaoThread.split('{')[0].trim(), inicioFuncao);

        //Se a função tem nome, remove
        if( isFuncaoComNome )
        {
            const inicioComNomeRemovido = inicioFuncao.replace(nomeFuncao, '');
            funcaoThread = funcaoThread.replace(inicioFuncao, inicioComNomeRemovido)
        }

        const workerCode = `
            self.onmessage = ${funcaoThread}
        `;

        // Criando um Blob com o código do worker
        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerURL = URL.createObjectURL(blob);

        // Criando o Web Worker a partir da URL do Blob
        const worker = new Worker(workerURL);

        // Cria uma Thread dentro do Array de processos criados
        const indiceThread = this.threadsCriadas.push( 

            new OptiComputation.sketch.Thread({
                timestampCriado: new Date().getTime(),
                worker: worker,
                funcao: funcao,
                funcaoString: funcaoString,
                parametros: parametros,
                
                callbacks: {
                    onComecou  : callbacks.onComecou,
                    onTerminou : callbacks.onTerminou
                },

                //Parametros internos
                _internal: {
                    funcaoStringAjustada: funcaoThread
                }

            }) 

        );

        // Pega a referencia da thread
        const referenciaThread = this.threadsCriadas[ indiceThread-1 ];
        
        // Registra quando essa Thread começou
        referenciaThread.registrarInicio();

        // Coloca ela em um JSON para poder facilitar o acesso
        this.mapaThreads[ referenciaThread.timestampCriado ] = referenciaThread;

        // Recebendo a resposta do Worker
        worker.onmessage = function(resultado) {

            // Registra que essa Thread terminou
            referenciaThread.registrarFim();

            // Chama o callback de quando essa Thread termina
            referenciaThread.callbacks['onTerminou'].bind(referenciaThread)( resultado.data, referenciaThread );
            
            // Encerra o worker
            worker.terminate();
            URL.revokeObjectURL(workerURL);
        };

        referenciaThread.callbacks['onComecou'].bind(referenciaThread)( referenciaThread );

        // Enviando uma mensagem para o Worker
        worker.postMessage(parametros); 

        // Retorna a referencia da Thread
        return referenciaThread;
    }
    
    /**
    * Cria uma thread na GPU com WebGL
    * Ele executa um código GLSL diretamente na GPU
    * 
    * @param {*} fragmentShader - um código GLSL
    * @param {*} vertexShader - um código GLSL
    * @param {*} parametros - um JSON que tem os parametros que vão ser usados(variaveis)
    * @param {*} parametros_execucao - Configurações de execucação do GLSL
    */
    criarThreadGLSL = function( scriptFragment=null, scriptVertex=null, parametros={}, parametros_execucao={} ){
        if(!scriptFragment){
            throw Error('Voce precisa definir o scriptFragment para fazer os calculos!');
        }      

        // Código do fragment shader GLSL
        const fragmentShaderSource = scriptFragment;
        
        const vertexShaderSource = scriptVertex;

        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);

        const gl = canvas.getContext('webgl2');
        console.log(gl ? "WebGL ativado!" : "WebGL não suportado.");

        console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error("Erro ao compilar shader: " + gl.getShaderInfoLog(shader));
            }
            return shader;
        }
        
        // Criando shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        function createProgram(gl, vertexShader, fragmentShader) {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error("Erro ao linkar programa: " + gl.getProgramInfoLog(program));
            }
            return program;
        }

        //Define os parametros usados no código de forma dinamica
        function setUniforms(gl, program, dadosParametros) {
            for (const name in dadosParametros) {
                const location = gl.getUniformLocation(program, name);
                const value = dadosParametros[name];
        
                if (location === null) {
                    console.warn(`Uniforme ${name} não encontrado!`);
                }
        
                if( parametros_execucao.matricial == true )
                {
                    //Se o "value" for um array ou uma matrix
                    if ( Array.isArray(value) || value instanceof Float32Array ) 
                    {
                        const lengthValue = value.length;

                        if (lengthValue === 4) {
                            // Se for uma matriz 2x2, passe os 4 valores
                            gl.uniformMatrix2fv(location, false, new Float32Array(value));
                        } else if (lengthValue === 9) {
                            // Matriz 3x3
                            gl.uniformMatrix3fv(location, false, new Float32Array(value));
                        } else if (lengthValue === 16) {
                            // Matriz 4x4
                            gl.uniformMatrix4fv(location, false, new Float32Array(value));
                        } else {
                            console.warn(`Formato de matriz não suportado para ${name}: tamanho ${length}`);
                        }
                    }
                }   

                //Se "value" for um número
                if (typeof value === "number") {
                    gl.uniform1f(location, value);

                //Se "value" for um array 32bits
                } else if (value instanceof Int32Array) {
                    gl.uniform1iv(location, value);
                    
                //Se "value" for um array 32bits
                } else if (value instanceof Uint32Array) {
                    gl.uniform1uiv(location, value);

                // Caso constrário
                } else if (Array.isArray(value)) {
                    if (value.length === 2) gl.uniform2fv(location, new Float32Array(value));
                    else if (value.length === 3) gl.uniform3fv(location, new Float32Array(value));
                    else if (value.length === 4) gl.uniform4fv(location, new Float32Array(value));
                    else if (value.length === 9) gl.uniformMatrix3fv(location, false, new Float32Array(value));
                    else if (value.length === 16) gl.uniformMatrix4fv(location, false, new Float32Array(value));
                    else {
                        console.warn(`Tipo de uniform desconhecido para ${name}`);
                    }
                }
            }
        }
          
        
        // Criando o programa WebGL
        const program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);

        // Criação de um buffer para um quadrado da tela
        const vertices = new Float32Array([
            -1.0, -1.0,  // Inferior esquerdo
            1.0, -1.0,  // Inferior direito
            -1.0,  1.0,  // Superior esquerdo
            1.0,  1.0   // Superior direito
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Obtém a localização do atributo "position"
        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Envia os parâmetros para a função
        setUniforms(gl, program, parametros);

        const framebuffer = gl.createFramebuffer();
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Definindo os parâmetros da textura
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Limpa o framebuffer e desenha
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Executa o shader (não estamos desenhando, mas o shader será executado)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Lendo a saída da textura com flexibilidade para qualquer tamanho de output
        const outputWidth = 1; // Defina com base no que seu shader espera
        const outputHeight = 1; // Defina com base no que seu shader espera
        const output = new Uint8Array(outputWidth * outputHeight * 4); // RGBA para cada pixel

        gl.readPixels(0, 0, outputWidth, outputHeight, gl.RGBA, gl.UNSIGNED_BYTE, output);     

        console.log("Resultado GLSL:", output);

        return {
            gl:  gl,
            program: program,
            framebuffer: framebuffer,
            texture: texture,
            canvas: canvas,
            output: output
        };
    }
}