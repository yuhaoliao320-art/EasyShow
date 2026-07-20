import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CategoryTreeNode } from '../types'

interface CategoryTreeProps {
  tree: CategoryTreeNode[]
  /** 當前選中的分類 ID */
  activeId?: number
}

const CategoryTreeItem: React.FC<{
  node: CategoryTreeNode
  activeId?: number
}> = ({ node, activeId }) => {
  const [expanded, setExpanded] = useState(node.depth === 0)
  const navigate = useNavigate()
  const hasChildren = node.children.length > 0
  const isActive = node.id === activeId

  const handleCategoryClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    // 避免點擊展開按鈕時也觸發導航
    if ((e as React.MouseEvent).button === 0 || (e as React.KeyboardEvent).key === 'Enter') {
      navigate(`/category/${node.id}`)
    }
  }

  return (
    <div className="tree-item" style={{ paddingLeft: `${node.depth * 20}px` }}>
      <div className={`tree-node ${isActive ? 'tree-node-active' : ''}`}>
        {hasChildren ? (
          <button
            className="tree-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? '收合' : '展開'}
          >
            <span className={`tree-arrow ${expanded ? 'expanded' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="tree-toggle-placeholder" />
        )}
        <button
          className={`tree-label ${isActive ? 'active' : ''}`}
          onClick={handleCategoryClick}
          onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(e)}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              activeId={activeId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ tree, activeId }) => {
  return (
    <div className="category-tree">
      {tree.map((node) => (
        <CategoryTreeItem
          key={node.id}
          node={node}
          activeId={activeId}
        />
      ))}
    </div>
  )
}

export default CategoryTree
