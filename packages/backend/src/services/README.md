# FileParserService 文件解析服务

## 功能概述

FileParserService 是一个用于解析各种文件类型并提取内容的服务。该服务采用单例模式设计，支持多种文件格式的解析，并能提取文件的元信息。

## 主要特性

- **多种文件格式支持**：支持PDF、Word(docx/doc)、Excel、CSV、HTML、XML、PPT等多种文件格式
- **文件元信息提取**：能够提取文件的基本元信息，如创建时间、修改时间、文件大小等
- **内容格式化**：对解析后的内容进行格式化，使其适合大模型对话
- **错误处理**：提供完善的错误处理机制

## 使用方法

### 基本使用

```typescript
// 获取FileParserService实例
const fileParserService = FileParserService.getInstance();

// 解析文件内容
const content = await fileParserService.parseFile('/path/to/file.pdf');
console.log(content);
```

### 获取文件元信息

```typescript
// 获取文件元信息
const metadata = await fileParserService.getFileMetadata('/path/to/file.pdf');
console.log(metadata);
```

### 同时获取内容和元信息

```typescript
// 解析文件并获取元信息
const result = await fileParserService.parseFile('/path/to/file.pdf', true);
console.log(result.content); // 文件内容
console.log(result.metadata); // 文件元信息
```

## 支持的文件类型

- **文本文件**：.txt, .js, .ts, .tsx, .jsx, .css, .scss, .less, .json, .md
- **文档文件**：.pdf, .docx, .doc
- **表格文件**：.xlsx, .xls, .csv
- **网页文件**：.html, .htm
- **数据文件**：.xml
- **演示文件**：.pptx, .ppt (基础支持)

## 依赖项

该服务依赖以下第三方库：

- langchain/document_loaders/fs/pdf：用于解析PDF文件
- langchain/document_loaders/fs/docx：用于解析DOCX文件
- exceljs：用于解析Excel文件
- csv-parser：用于解析CSV文件
- cheerio：用于解析HTML文件
- xml2js：用于解析XML文件
- mammoth：用于解析DOC文件
- file-type：用于检测文件MIME类型

## 注意事项

- 对于大文件，解析可能需要较长时间
- 某些特殊格式的文件可能无法正确解析
- PPT文件的解析功能较为基础，可能需要进一步完善