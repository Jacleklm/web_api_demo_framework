import React, { useState } from "react";
import SparkMD5 from 'spark-md5';

const FileUpload = () => {
  const [progress, setProgress] = useState(0);

  const calculateHash = (file) => {
    return new Promise((resolve) => {
      const chunkSize = 2 * 1024 * 1024; // 分片计算，避免卡顿
      const chunks = Math.ceil(file.size / chunkSize);
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();

      let currentChunk = 0;

      reader.onload = (e) => {
        spark.append(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
          loadNextChunk();
        } else {
          resolve(spark.end()); // 返回最终哈希
        }
      };

      const loadNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        reader.readAsArrayBuffer(file.slice(start, end));
      };

      loadNextChunk();
    });
  };

  const handleUpload = async (file) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 每片 5MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileHash = await calculateHash(file); // 计算文件唯一哈希（下文实现）

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("hash", fileHash);
      formData.append("index", i);
      formData.append("totalChunks", totalChunks);

      await uploadChunk(formData); // 上传分片
      setProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    await mergeChunks(file.name, fileHash, totalChunks); // 通知后端合并
  };

  return (
    <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
  );
};

export default FileUpload;
