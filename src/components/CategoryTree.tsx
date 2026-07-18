import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  const hasChildren = node.children.length > 0
  const isActive = node.id === activeId

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
        <Link
          to={`/category/${node.id}`}
          className={`tree-label ${isActive ? 'active' : ''}`}
        >
          {node.name}
        </Link>
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
