import os
import fitz  # PyMuPDF


def extract_pages_to_pdf(input_pdf, output_pdf, page_numbers):
    """
    提取指定页码生成新PDF
    :param page_numbers: 需要提取的页码列表（人类习惯，从1开始，如[1, 3, 5]）
    """
    src_doc = fitz.open(input_pdf)
    new_doc = fitz.open()

    for page_num in page_numbers:
        if 1 <= page_num <= src_doc.page_count:
            # insert_pdf 的索引是从 0 开始的，所以要减 1
            new_doc.insert_pdf(src_doc, from_page=page_num - 1, to_page=page_num - 1)
        else:
            print(f"警告: 页码 {page_num} 超出范围，已跳过")

    new_doc.save(output_pdf)
    src_doc.close()
    new_doc.close()
    print(f"✅ 提取完成，新PDF已保存为: {output_pdf}")


def convert_pages_to_images(pdf_path, output_folder, page_numbers, dpi=300):
    """
    将PDF指定页面转换为高清图片
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    doc = fitz.open(pdf_path)
    for page_num in page_numbers:
        if 1 <= page_num <= doc.page_count:
            page = doc.load_page(page_num - 1)  # 索引从0开始
            # dpi=300 适合打印和高清查看，默认通常是72
            pix = page.get_pixmap(dpi=dpi)
            img_path = os.path.join(output_folder, f"page_{page_num}.png")
            pix.save(img_path)
            print(f"✅ 已保存: {img_path}")
    doc.close()


def merge_images_to_pdf(image_folder, output_pdf):
    """
    将文件夹内的图片合并为一个PDF（无边距铺满）
    """
    # 获取图片并排序
    image_files = sorted(
        [
            f
            for f in os.listdir(image_folder)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
    )
    if not image_files:
        print("文件夹内没有找到图片！")
        return

    doc = fitz.open()
    for img_file in image_files:
        img_path = os.path.join(image_folder, img_file)
        # 从文件创建一个图片对象，并作为新的一页插入到文档末尾
        img_doc = fitz.open(img_path)
        # 获取图片页面的 PDF 格式
        pdf_bytes = img_doc.convert_to_pdf()
        img_pdf = fitz.open("pdf", pdf_bytes)
        doc.insert_pdf(img_pdf)
        img_doc.close()
        img_pdf.close()  # 关闭图片文档

    doc.save(output_pdf)
    doc.close()
    print(f"✅ 图片合并完成，PDF已保存为: {output_pdf}")


def merge_multiple_pdfs(pdf_list, output_pdf):
    """
    将多个PDF文件合并为一个
    :param pdf_list: PDF文件路径的列表，如 ['a.pdf', 'b.pdf']
    """
    merged_doc = fitz.open()
    for pdf in pdf_list:
        current_doc = fitz.open(pdf)
        merged_doc.insert_pdf(current_doc)
        current_doc.close()

    merged_doc.save(output_pdf)
    merged_doc.close()
    print(f"✅ 多个PDF合并完成，已保存为: {output_pdf}")


def insert_blank_page(input_pdf, output_pdf, insert_at, width=595, height=842):
    """
    在指定位置插入空白页
    :param insert_at: 插入位置的索引（从0开始）
                      例如：0表示在最前面插入，1表示在第1页和第2页之间插入
                      如果传入 -1，则表示在文档末尾插入
    :param width: 页面宽度（默认595，即A4纸宽度）
    :param height: 页面高度（默认842，即A4纸高度）
    """
    doc = fitz.open(input_pdf)
    page_count = doc.page_count

    # 1. 确定要匹配尺寸的参考页索引
    ref_page_idx = None

    if insert_at == 0:
        # 插入第一页：匹配原第一页（索引0）的大小
        ref_page_idx = 0
    elif insert_at == -1 or insert_at >= page_count:
        # 插入最后一页：匹配原最后一页的大小
        ref_page_idx = page_count - 1
    else:
        # 插入中间：匹配前一页（即 insert_at - 1）的大小
        ref_page_idx = insert_at - 1

    # 2. 获取参考页面的尺寸 (rect 包含宽度和高度信息)
    ref_page = doc.load_page(ref_page_idx)
    page_rect = ref_page.rect

    # 3. 在指定位置插入相同尺寸的空白页
    # new_page 的 pno 参数就是你要插入的位置索引
    doc.new_page(pno=insert_at, width=page_rect.width, height=page_rect.height)

    doc.save(output_pdf)
    doc.close()
    print(
        f"✅ 已在索引 {insert_at} 处插入匹配尺寸的空白页，新PDF已保存为: {output_pdf}"
    )


if __name__ == "__main__":
    # 使用示例
    insert_blank_page("./最终合并的PDF2.pdf", "./空白页面插入后的PDF.pdf", insert_at=0)
