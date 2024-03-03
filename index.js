const express = require('express');
const cache = require('memory-cache');
const crypto = require('crypto');
const app = express();

/**
 * GET LISTA PRODUTOS
 */
const lista_produtos = {
    produtos: [
        { id: 1, descricao: "Arroz parboilizado 5Kg", valor: 25.00, marca: "Tio João"  },
        { id: 2, descricao: "Maionese 250gr", valor: 7.20, marca: "Helmans"  },
        { id: 3, descricao: "Iogurte Natural 200ml", valor: 2.50, marca: "Itambé"  },
        { id: 4, descricao: "Batata Maior Palha 300gr", valor: 15.20, marca: "Chipps"  },
        { id: 5, descricao: "Nescau 400gr", valor: 8.00, marca: "Nestlé"  },
    ]
}

app.use(express.json());

/**
 * CONFIGURAÇÃO DO CACHE (PADRÃO 10 MINUTOS)
 */
app.use((req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);
    if (cachedBody) {
        const clientETag = req.headers['if-none-match'];
        if (clientETag === cachedBody.etag) {
            res.status(304).end();
            return;
        }
        res.set('ETag', cachedBody.etag);
        res.send(cachedBody.data);
    } else {
        res.sendResponse = res.send;
        res.send = (body) => {
            const etag = generateETag(body);
            cache.put(key, { data: body, etag: etag }, 10 * 60 * 1000);
            res.set('ETag', etag);
            res.sendResponse(body);
        };
        next();
    }
})

function generateETag(body) {
    if(!body){
        crypto.createHash('md5').update(JSON.stringify("body")).digest('hex');
    }else{
        return crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
    }
}


app.get('/produtos', (req, res) => {
    res.json(lista_produtos);
})

/**
 * GET BY ID
 */
app.get('/produtos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const produto = lista_produtos.produtos.find(produto => produto.id === id);

    if(produto){
        res.json(produto);
    } else {
        res.status(404).send();
    }
})


/**
 * POST PRODUTOS
 */
app.post('/produtos', (req, res) => {
    const {descricao, valor, marca} = req.body;

    if(!descricao || !valor || !marca) {
        return res.status(400).json({error: 'Obrigatório o preenchimento dos campos descrição, valor e marca'});
    }

    const novoProduto = {
        id: lista_produtos.produtos.length + 1,
        descricao,
        valor,
        marca
    }

    lista_produtos.produtos.push(novoProduto);

    res.status(201).json(novoProduto);
})


/**
 * ATUALIZAR PRODUTO
 */
app.put('/produtos/:id', (req, res) => {
    const produtoID = parseInt(req.params.id);
    const {descricao, valor, marca} = req.body;

    const index = lista_produtos.produtos.findIndex(produto => produto.id === produtoID)

    if(index === -1){
        return res.status(404).json({error: 'Produto não encontrado'});
    }

    lista_produtos.produtos[index].descricao = descricao;
    lista_produtos.produtos[index].valor = valor;
    lista_produtos.produtos[index].marca = marca;

    res.json(lista_produtos.produtos[index]);
})


/**
 * DELETAR PRODUTO
 */
app.delete('/produtos/:id', (req, res) => {
    const produtoID = parseInt(req.params.id);
    
    const index = lista_produtos.produtos.findIndex(produto => produto.id === produtoID);

    if(index === -1){
        return res.status(404).json({error: 'Produto não encontrado'});
    }

    lista_produtos.produtos.splice(index, 1);

    res.json({message: 'Produto excluido com sucesso'});
})



app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
})