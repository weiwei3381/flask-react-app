# 基于Flask+React的检索应用

backend为后端代码，cd进去之后使用`pip install -r requirements.txt`安装相关依赖，然后使用`python app.py`运行后端

frontend为前端代码，首先使用`npm run build`编译前端内容，然后将`run_server.py`文件复制到`dist`目录下，然后`cd ./frontend/dist`进入编译后的代码后，使用`python ./run_server.py`运行前端服务