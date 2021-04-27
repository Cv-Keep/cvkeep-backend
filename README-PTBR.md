# CV Keep - Back End

This is the **CV Keep Back End** repository.    
You can access the production app here: https://cvkeep.com.  

# What is it?

`EN`: If you want to read this documentation in english [clique aqui](https://github.com/Cv-Keep/cvkeep-backend/blob/main/README.md)  

CV Keep é uma plataforma livre e de código aberto feita para mantenimento e gerencialmento de multiplos curriculums. É perfeita se vc não gosta de ficar editando um monte de coisas pra manter um currículo atualizado ou se você não quer lidar com redes sociais só para manter um CV online. A plataforma oferece um currículo online responsivo, multi-device, rápido e fácil de manter e atualizar.

Uma vez que a plataforma é livre e de código aberto, você pode hospedar a sua própria plataforma sem custo nem autorização nenhuma (desde que vc não use a mesma marca). Isso pode ser especialmente útil se vc tem um negócio que precisa guardar currículos, se você é uma agencia de empregos e precisa de um sistema de registro de usuários e currículos ou se você precisa salvar o profile profissional das pessoas por qualquer motivo, incluindo motivos comerciais.

# Stack

CV Keep foi escrito utilizando uma stack MEVN (Mongo, Express, Vue e Node), e é focado em simplicidade. Uma vez que vc configurou todos os arquivos .env corretamente, o app está pronto para ser executado. A aplicação vem production ready e internacionalizada (`en` e `pt-br` por padrão).

# Quick Start

Pra rodar a aplicação de forma local, vc deve rodar os seguintes comandos:
Obs: Esta API é feita para ser consumida pelo projeto `CV Keep Front End`.

1. Clone este repositório
2. Copie o arquivo `.env` para `.env.local` e configure-o
2. Rode `npm install`
3. Rode `npm run serve`
4. Por padrão, esta API estará disponínel em http://localhost:5000/

:warning: Se vc não configurou corretamente sua `.env.local`, os passos acima irão rodar uma aplicação desconfigurada. É fortemente recomendado que vc leia a documentação dessa aplicação afim de configura-la corretamente, incluindo arquivos `.env`, frontend e backend.

# Documentação

Para documentação completa sobre uso, desenvolvimento e deployment, por favor [CLIQUE AQUI](https://github.com/Cv-Keep/cvkeep-docs).