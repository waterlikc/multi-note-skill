import { SmartNoteGenerator } from './core/smart-note-generator.js'
import { ModelOptimizer } from './core/model-optimizer.js'
import { PerformanceMonitor } from './core/performance-monitor.js'

// Python并发编程技术笔记生成示例
const pythonConcurrencyContent = `
# Python并发编程：从入门到实战

## 并发编程基础概念

### 什么是并发编程？

并发编程是指程序能够同时处理多个任务的编程技术。在现代计算机系统中，并发是提升性能的重要手段。

### 并发vs并行

- **并发**：多个任务在同一个CPU核心上交替执行
- **并行**：多个任务同时在不同CPU核心上执行

### Python中的并发模型

Python主要有两种并发模型：
1. **多线程**：使用threading模块
2. **多进程**：使用multiprocessing模块

## 多线程编程

### threading模块基础

\`\`\`python
import threading
import time

def worker(name):
    print(f"线程 {name} 开始工作")
    time.sleep(2)
    print(f"线程 {name} 工作完成")

# 创建多个线程
threads = []
for i in range(3):
    t = threading.Thread(target=worker, args=(f"Thread-{i}",))
    threads.append(t)
    t.start()

# 等待所有线程完成
for t in threads:
    t.join()

print("所有线程工作完成")
\`\`\`

### 线程同步机制

#### 1. 锁机制 (Lock)

\`\`\`python
import threading

lock = threading.Lock()
shared_counter = 0

def increment_counter():
    global shared_counter
    for _ in range(100000):
        with lock:  # 使用锁保护共享资源
            shared_counter += 1

threads = [threading.Thread(target=increment_counter) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"最终计数值: {shared_counter}")  # 应该是 200000
\`\`\`

#### 2. 信号量 (Semaphore)

\`\`\`python
import threading
import time

semaphore = threading.Semaphore(3)  # 最多允许3个线程同时运行

def worker(worker_id):
    with semaphore:
        print(f"Worker {worker_id} 正在执行任务")
        time.sleep(2)
        print(f"Worker {worker_id} 任务完成")

# 创建5个工作线程，但最多3个同时运行
threads = [threading.Thread(target=worker, args=(i,)) for i in range(5)]
for t in threads:
    t.start()
for t in threads:
    t.join()
\`\`\`

#### 3. 条件变量 (Condition)

\`\`\`python
import threading

condition = threading.Condition()
ready = False

def consumer():
    with condition:
        condition.wait_for(lambda: ready)  # 等待ready变为True
        print("消费者开始处理数据")

def producer():
    global ready
    time.sleep(1)
    with condition:
        ready = True
        print("生产者数据准备完成")
        condition.notify_all()  # 通知所有等待的线程

# 启动生产者和消费者
t1 = threading.Thread(target=consumer)
t2 = threading.Thread(target=producer)

t1.start()
t2.start()

t1.join()
t2.join()
\`\`\`

### 线程池

\`\`\`python
from concurrent.futures import ThreadPoolExecutor
import time

def task(name):
    print(f"{name} 开始执行")
    time.sleep(1)
    print(f"{name} 执行完成")
    return f"{name}的结果"

# 使用线程池执行任务
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(task, f"任务{i}") for i in range(5)]
    
    for future in concurrent.futures.as_completed(futures):
        print(f"获得结果: {future.result()}")
\`\`\`

## 多进程编程

### multiprocessing模块基础

\`\`\`python
import multiprocessing
import time

def worker(name):
    print(f"进程 {name} 开始工作 (PID: {multiprocessing.current_process().pid})")
    time.sleep(2)
    print(f"进程 {name} 工作完成")

if __name__ == '__main__':
    # 创建多个进程
    processes = []
    for i in range(4):
        p = multiprocessing.Process(target=worker, args=(f"Process-{i}",))
        processes.append(p)
        p.start()

    for p in processes:
        p.join()

    print("所有进程工作完成")
\`\`\`

### 进程间通信 (IPC)

#### 1. Queue队列

\`\`\`python
import multiprocessing

def producer(queue):
    for i in range(5):
        queue.put(f"消息-{i}")
        print(f"生产者放入消息-{i}")

def consumer(queue):
    while True:
        item = queue.get()
        if item == 'STOP':
            break
        print(f"消费者取出: {item}")
        queue.task_done()

if __name__ == '__main__':
    queue = multiprocessing.Queue()
    
    # 启动消费者进程
    consumer_process = multiprocessing.Process(target=consumer, args=(queue,))
    consumer_process.start()

    # 生产者放入消息
    producer_process = multiprocessing.Process(target=producer, args=(queue,))
    producer_process.start()

    producer_process.join()
    queue.put('STOP')  # 发送停止信号
    consumer_process.join()
\`\`\`

#### 2. 共享内存

\`\`\`python
import multiprocessing

def worker(shared_list):
    shared_list.append("工作完成")
    print(f"进程 {multiprocessing.current_process().pid} 添加了数据")
    print(f"共享列表内容: {shared_list}")

if __name__ == '__main__':
    # 创建共享列表
    shared_list = multiprocessing.Manager().list()
    
    processes = []
    for i in range(3):
        p = multiprocessing.Process(target=worker, args=(shared_list,))
        processes.append(p)
        p.start()

    for p in processes:
        p.join()

    print(f"最终共享列表: {shared_list}")
\`\`\`

### 进程池

\`\`\`python
from multiprocessing import Pool
import time

def heavy_computation(x):
    print(f"开始处理数据 {x}")
    time.sleep(1)
    result = x * x
    print(f"完成处理数据 {x}，结果: {result}")
    return result

if __name__ == '__main__':
    data = [1, 2, 3, 4, 5, 6, 7, 8]
    
    # 使用进程池并行处理
    with Pool(processes=3) as pool:
        results = pool.map(heavy_computation, data)

    print(f"最终结果: {results}")
\`\`\`

## 异步编程

### asyncio基础

\`\`\`python
import asyncio
import time

async def delayed_operation(name, delay):
    print(f"{name} 开始执行，延迟 {delay} 秒")
    await asyncio.sleep(delay)
    print(f"{name} 执行完成")
    return f"{name}的结果"

async def main():
    # 创建多个异步任务
    tasks = [
        delayed_operation("任务1", 1),
        delayed_operation("任务2", 2),
        delayed_operation("任务3", 1.5)
    ]

    # 并发执行所有任务
    results = await asyncio.gather(*tasks)
    print(f"所有任务完成: {results}")

# 运行异步程序
asyncio.run(main())
\`\`\`

### 异步HTTP请求

\`\`\`python
import asyncio
import aiohttp
import time

async def fetch_url(url):
    print(f"开始获取 {url}")
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            text = await response.text()
            print(f"完成获取 {url}, 长度: {len(text)}")
            return text

async def main():
    urls = [
        'https://httpbin.org/get',
        'https://httpbin.org/delay/1',
        'https://httpbin.org/uuid'
    ]

    start_time = time.time()
    
    # 并发获取多个URL
    tasks = [fetch_url(url) for url in urls]
    results = await asyncio.gather(*tasks)

    total_time = time.time() - start_time
    print(f"总耗时: {total_time:.2f} 秒")

# 运行异步HTTP请求
# asyncio.run(main())
\`\`\`

### 异步文件操作

\`\`\`python
import asyncio
import aiofiles

async def read_file_async(file_path):
    print(f"开始读取文件: {file_path}")
    async with aiofiles.open(file_path, mode='r') as f:
        content = await f.read()
        print(f"完成读取文件: {file_path}, 长度: {len(content)}")
        return content

async def write_file_async(file_path, content):
    print(f"开始写入文件: {file_path}")
    async with aiofiles.open(file_path, mode='w') as f:
        await f.write(content)
        print(f"完成写入文件: {file_path}")

async def process_files_async():
    files = ['file1.txt', 'file2.txt', 'file3.txt']
    
    # 并发处理多个文件
    read_tasks = [read_file_async(f) for f in files]
    results = await asyncio.gather(*read_tasks)
    
    print(f"读取了 {len(results)} 个文件")

# 运行异步文件处理
# asyncio.run(process_files_async())
\`\`\`

## 性能对比

### 不同并发模型的适用场景

| 模型 | 适用场景 | 优势 | 劣势 |
|------|----------|------|------|
| **多线程** | I/O密集型任务 | 轻量级，切换快 | GIL限制CPU性能 |
| **多进程** | CPU密集型任务 | 绕过GIL限制 | 资源消耗大 |
| **异步编程** | 高并发I/O | 单线程高性能 | 编程复杂度高 |

### 性能测试结果

\`\`\`python
import time
import threading
import multiprocessing
import asyncio

def sync_function():
    time.sleep(1)  # 模拟I/O操作
    return "同步完成"

def thread_function():
    time.sleep(1)
    return "线程完成"

def process_function():
    time.sleep(1)
    return "进程完成"

async def async_function():
    await asyncio.sleep(1)
    return "异步完成"

# 性能测试
def performance_test():
    # 同步执行
    start = time.time()
    for _ in range(5):
        sync_function()
    sync_time = time.time() - start
    
    # 多线程执行
    start = time.time()
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(lambda x: thread_function(), range(5)))
    thread_time = time.time() - start
    
    # 异步执行
    async def async_test():
        start = time.time()
        results = await asyncio.gather(*[async_function() for _ in range(5)])
        return time.time() - start, results
    
    async_time, results = asyncio.run(async_test())

    print(f"同步执行: {sync_time:.2f}秒")
    print(f"多线程执行: {thread_time:.2f}秒")
    print(f"异步执行: {async_time:.2f}秒")

# performance_test()
\`\`\`

## 最佳实践

### 1. 选择合适的并发模型

- **I/O密集型**: 使用多线程或异步编程
- **CPU密集型**: 使用多进程绕过GIL
- **高并发场景**: 优先选择异步编程

### 2. 避免共享状态修改

\`\`\`python
# ❌ 错误：多线程修改共享状态
counter = 0

def increment():
    global counter
    counter += 1  # 不是原子操作，可能导致竞态条件

# ✅ 正确：使用锁或线程安全的数据结构
from threading import Lock

counter = 0
lock = Lock()

def increment_safe():
    global counter
    with lock:
        counter += 1
\`\`\`

### 3. 合理设置线程/进程数量

\`\`\`python
import os

def get_optimal_workers():
    # CPU密集型：CPU核心数
    cpu_count = os.cpu_count()
    
    # I/O密集型：CPU核心数 * 5
    io_multiplier = 5
    
    return cpu_count, io_multiplier

cpu_count, io_multiplier = get_optimal_workers()

print(f"CPU密集型推荐: {cpu_count} 个进程")
print(f"I/O密集型推荐: {cpu_count * io_multiplier} 个线程")
\`\`\`

### 4. 使用超时和取消机制

\`\`\`python
import asyncio

async def task_with_timeout():
    try:
        # 设置5秒超时
        result = await asyncio.wait_for(async_operation(), timeout=5.0)
        return result
    except asyncio.TimeoutError:
        print("任务超时，已取消")
        return None
\`\`\`

### 5. 错误处理和资源清理

\`\`\`python
import asyncio

async def safe_task():
    resource = None
    try:
        resource = await acquire_resource()
        result = await process_with_resource(resource)
        return result
    except Exception as e:
        print(f"任务执行失败: {e}")
        raise
    finally:
        if resource:
            await release_resource(resource)  # 确保资源释放
\`\`\`

## 常见陷阱和解决方案

### 1. 死锁问题

\`\`\`python
import threading

# ❌ 可能导致死锁
lock1 = threading.Lock()
lock2 = threading.Lock()

def task1():
    with lock1:
        with lock2:
            pass

def task2():
    with lock2:
        with lock1:
            pass

# ✅ 解决：使用统一的锁获取顺序
def task1_safe():
    with lock1:
        with lock2:
            pass

def task2_safe():
    with lock1:
        with lock2:
            pass
\`\`\`

### 2. 全局解释器锁 (GIL) 的限制

\`\`\`python
# ❌ 多线程在CPU密集型任务中效果不佳
import threading
import time

def cpu_intensive_task():
    total = 0
    for i in range(1000000):
        total += i
    return total

# 多线程反而更慢（因为GIL）
threads = [threading.Thread(target=cpu_intensive_task) for _ in range(4)]
start = time.time()
for t in threads:
    t.start()
for t in threads:
    t.join()
thread_time = time.time() - start

# 多进程能真正并行
from multiprocessing import Pool
with Pool(processes=4) as pool:
    start = time.time()
    results = pool.map(cpu_intensive_task, range(4))
    process_time = time.time() - start

print(f"多线程时间: {thread_time:.2f}秒")
print(f"多进程时间: {process_time:.2f}秒")
\`\`\`

### 3. 异步中的同步阻塞

\`\`\`python
import asyncio

# ❌ 同步阻塞会阻塞整个事件循环
async def bad_async():
    time.sleep(2)  # 同步阻塞，会阻止其他协程执行
    return "完成"

# ✅ 使用异步sleep
async def good_async():
    await asyncio.sleep(2)  # 异步非阻塞
    return "完成"
\`\`\`

## 实际应用场景

### 1. Web爬虫并发

\`\`\`python
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def crawl_page(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.title.string if soup.title else "无标题"
            print(f"抓取完成: {title}")
            return {"url": url, "title": title}

async def batch_crawl(urls):
    tasks = [crawl_page(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results

# 示例URLs
urls = [
    'https://httpbin.org/get',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/uuid'
]

# 异步批量爬取
# results = asyncio.run(batch_crawl(urls))
\`\`\`

### 2. 数据处理流水线

\`\`\`python
import asyncio

async def fetch_data(source):
    await asyncio.sleep(1)  # 模拟数据获取
    return {"source": source, "data": [1, 2, 3, 4, 5]}

async def process_data(data_dict):
    await asyncio.sleep(0.5)  # 模拟数据处理
    processed = [x * 2 for x in data_dict["data"]]
    return {"data": processed}

async def save_data(data_dict):
    await asyncio.sleep(0.5)  # 模拟数据保存
    print(f"保存数据: {data_dict}")
    return {"saved": True}

async def data_pipeline():
    # 数据获取 -> 处理 -> 保存
    data = await fetch_data("API")
    processed = await process_data(data)
    saved = await save_data(processed)
    return {"status": "完成", "pipeline": [data, processed, saved]}

# 运行数据流水线
# result = asyncio.run(data_pipeline())
\`\`\`

### 3. 定时任务调度

\`\`\`python
import asyncio

async def periodic_task():
    while True:
        print("执行定时任务...")
        await asyncio.sleep(10)  # 每10秒执行一次

async def main():
    # 创建任务但不等待其完成（后台运行）
    asyncio.create_task(periodic_task())
    
    # 主程序继续执行其他任务
    print("主程序继续运行")
    
    # 模拟主程序工作
    for i in range(3):
        print(f"主程序任务 {i}")
        await asyncio.sleep(2)
    
    print("主程序完成")

# asyncio.run(main())
\`\`\`

## 性能优化技巧

### 1. 使用连接池

\`\`\`python
import aiohttp

async def fetch_with_pool(urls):
    # 创建连接池，限制最大连接数
    connector = aiohttp.TCPConnector(limit=10)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [session.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        
        for i, response in enumerate(responses):
            print(f"请求 {i+1}: {response.status}")

# 示例URLs
# urls = ['https://httpbin.org/get' for _ in range(20)]
# asyncio.run(fetch_with_pool(urls))
\`\`\`

### 2. 批量处理优化

\`\`\`python
import asyncio

async def process_item(item):
    await asyncio.sleep(0.1)  # 模拟处理时间
    return item * 2

async def batch_process_optimized(items, batch_size=10):
    results = []
    
    # 分批处理
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        print(f"处理批次 {i//batch_size + 1}, 包含 {len(batch)} 个项目")
        
        # 并发处理当前批次
        batch_results = await asyncio.gather(*[
            process_item(item) for item in batch
        ])
        
        results.extend(batch_results)
        
        # 批次间的小延迟，避免过载
        if i + batch_size < len(items):
            await asyncio.sleep(0.05)
    
    return results

# 测试批量处理优化
# items = list(range(100))
# results = asyncio.run(batch_process_optimized(items, batch_size=20))
\`\`\`

### 3. 内存使用优化

\`\`\`python
import asyncio

async def memory_efficient_processor(data_source):
    results = []
    semaphore = asyncio.Semaphore(5)  # 限制并发数，避免内存过载
    
    async def process_with_limit(item):
        async with semaphore:
            # 在限制内处理单个项目
            result = await heavy_processing(item)
            return result
    
    tasks = [process_with_limit(item) for item in data_source]
    results = await asyncio.gather(*tasks)
    
    return results

async def heavy_processing(item):
    await asyncio.sleep(0.5)  # 模拟处理
    return f"处理结果: {item}"

# 测试内存优化
# data = list(range(100))
# results = asyncio.run(memory_efficient_processor(data))
\`\`\`

## 调试和监控

### 1. 线程/进程监控

\`\`\`python
import threading
import time

class TaskMonitor:
    def __init__(self):
        self.active_threads = 0
        self.completed_tasks = 0
        self.lock = threading.Lock()
    
    def task_started(self):
        with self.lock:
            self.active_threads += 1
            print(f"任务开始，活跃线程: {self.active_threads}")
    
    def task_completed(self):
        with self.lock:
            self.active_threads -= 1
            self.completed_tasks += 1
            print(f"任务完成，活跃线程: {self.active_threads}, 已完成: {self.completed_tasks}")

monitor = TaskMonitor()

def monitored_task(name):
    monitor.task_started()
    time.sleep(1)
    monitor.task_completed()
    return f"{name}完成"

# 测试监控
# threads = [threading.Thread(target=monitored_task, args=(f"任务{i}",)) for i in range(3)]
# for t in threads:
#     t.start()
# for t in threads:
#     t.join()
\`\`\`

### 2. 异步调试技巧

\`\`\`python
import asyncio
import logging

# 启用异步调试
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_async_task():
    logger.info("异步任务开始")
    
    try:
        result = await some_async_operation()
        logger.info(f"异步任务成功: {result}")
        return result
    except Exception as e:
        logger.error(f"异步任务失败: {e}")
        raise
    finally:
        logger.info("异步任务清理")

async def some_async_operation():
    await asyncio.sleep(0.5)
    return "操作结果"

# 运行调试
# asyncio.run(debug_async_task())
\`\`\`

## 总结

Python提供了丰富的并发编程选择：

1. **多线程**: 适合I/O密集型任务，轻量级但受GIL限制
2. **多进程**: 适合CPU密集型任务，真正并行但资源消耗大
3. **异步编程**: 高并发I/O的最佳选择，学习曲线较陡

**选择建议**:
- 简单I/O任务 → 多线程
- CPU密集型任务 → 多进程  
- 高并发网络请求 → 异步编程
- 复杂应用 → 混合使用

**关键原则**:
- 避免共享状态，使用线程安全机制
- 合理设置并发数，避免资源耗尽
- 正确处理异常，确保资源释放
- 选择合适的并发模型

**学习路径**:
1. 掌握threading基础（锁、信号量、条件变量）
2. 理解multiprocessing和进程间通信
3. 深入学习asyncio和异步编程模式
4. 实践项目应用，如异步爬虫、并发Web服务器

通过系统学习和实践，你将能够编写高效、稳定的Python并发程序。
`

async function generatePythonConcurrencyNote() {
  const generator = new SmartNoteGenerator()
  await generator.initializeSystem()

  const noteInput = {
    title: 'Python并发编程：从入门到实战',
    subtitle: '多线程、多进程与异步编程完整指南',
    date: '2026-07-15',
    content: pythonConcurrencyContent.trim()
  }

  const options = {
    formats: ['html', 'json', 'markdown'],
    modelPreferences: {
      priority: 'quality',
      maxResponseTime: '2-4s'
    }
  }

  const startTime = performance.now()

  try {
    const result = await generator.generateSmartNote(noteInput, options)
    const duration = performance.now() - startTime

    console.log('🎉 Python并发编程笔记生成成功！')
    console.log(`📊 性能指标:`)
    console.log(`   - 生成时间: ${duration.toFixed(2)}ms`)
    console.log(`   - 识别场景: ${result.metadata.scene}`)
    console.log(`   - 使用的模板: ${result.metadata.template}`)
    console.log(`   - Token消耗: ${result.metadata.tokenUsage.estimatedTotalTokens}`)
    console.log(`   - 缓存命中率: ${result.metadata.cacheHitRate}`)
    console.log(`   - 生成的格式: ${result.metadata.formats.join(', ')}`)
    console.log(`\n📁 文件已保存:`)
    
    return result

  } catch (error) {
    console.error('❌ 笔记生成失败:', error.message)
    throw error
  }
}

// 导出生成函数
export { generatePythonConcurrencyNote }