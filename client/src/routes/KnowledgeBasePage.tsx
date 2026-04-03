import KnowledgeBaseContent from "../components/knowledge-base/KnowledgeBaseContent";
import { useKnowledgeBasePage } from "../hooks/useKnowledgeBasePage";

const KnowledgeBasePage = () => {
  const knowledgeBase = useKnowledgeBasePage();

  return (
    <KnowledgeBaseContent
      rows={knowledgeBase.rows}
      activeFilter={knowledgeBase.activeFilter}
      page={knowledgeBase.page}
      pageSize={knowledgeBase.pageSize}
      totalPages={knowledgeBase.totalPages}
      totalItems={knowledgeBase.totalItems}
      isLoadingRows={knowledgeBase.isLoadingRows}
      loadError={knowledgeBase.loadError}
      isUploading={knowledgeBase.isUploading}
      uploadMessage={knowledgeBase.uploadMessage}
      uploadProgress={knowledgeBase.uploadProgress}
      uploadPhase={knowledgeBase.uploadPhase}
      dispatchingRowIds={knowledgeBase.dispatchingRowIds}
      offloadingRowIds={knowledgeBase.offloadingRowIds}
      deletingRowIds={knowledgeBase.deletingRowIds}
      fileInputRef={knowledgeBase.fileInputRef}
      onFilterChange={knowledgeBase.setActiveFilter}
      onPageChange={knowledgeBase.setPage}
      onPageSizeChange={knowledgeBase.setPageSize}
      onFilesSelected={knowledgeBase.handleFilesSelected}
      onOpenFilePicker={knowledgeBase.handleOpenFilePicker}
      onOpenIndexedRow={knowledgeBase.handleOpenIndexedRow}
      onDispatchRow={knowledgeBase.handleDispatchRow}
      onOffloadRow={knowledgeBase.handleOffloadRow}
      onDeleteRow={knowledgeBase.handleDeleteRow}
      onOpenChat={knowledgeBase.handleOpenChat}
      onOpenKnowledgeBase={knowledgeBase.handleOpenKnowledgeBase}
    />
  );
};

export default KnowledgeBasePage;
