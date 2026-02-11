<div class="lastpost border-start border-2 lh-sm h-100" style="border-color: {./bgColor}!important;">
	{{{ each ./posts }}}
	{{{ if @first }}}
	<div component="category/posts" class="ps-2 text-xs d-flex flex-column h-100 gap-1">
		<div class="text-nowrap text-truncate">
			{{{ if (posts.anonymous && !posts.authorized) }}}
				<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='9' cy='9' r='8' fill='%23888' /></svg>" width="18" height="18" alt="Anonymous" class="rounded-circle" />
			{{{ else }}}
				<a class="text-decoration-none avatar-tooltip" title="{./user.displayname}" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(posts.user, "18px", true)}</a>
			{{{ end }}}
			<a class="permalink text-muted timeago text-xs" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" title="{./timestampISO}" aria-label="[[global:lastpost]]"></a>
			{{{ if posts.showPrivateIndicator }}}
				<span class="badge bg-warning text-dark rounded-1" title="[[posts:private-post-tooltip]]">
					<i class="fa fa-lock"></i> [[posts:private]]
				</span>
			{{{ end }}}
		</div>
		<div class="post-content text-xs text-break line-clamp-sm-2 lh-sm position-relative flex-fill">
			<a class="stretched-link" tabindex="-1" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" aria-label="[[global:lastpost]]"></a>
			{./content}
		</div>
	</div>
	{{{ end }}}
	{{{ end }}}

	{{{ if !./posts.length }}}
	<div component="category/posts" class="ps-2">
		<div class="post-content overflow-hidden text-xs">
			[[category:no-new-posts]]
		</div>
	</div>
	{{{ end }}}
</div>
